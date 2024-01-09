"use client";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import {
  RealtimeChannel,
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const TABLE_NAME = "messages";
const supabase = createClientComponentClient();

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [friends, setFriends] = useState<string[]>([]);

  const [nickname, setNickname] = useState<string>("anon");

  const router = useRouter();

  // 현재 페이지의 쿼리 파라미터를 가져오기
  const query = router.query;
  const channelName = query.channelName as string;
  const roomId = query.roomId;

  /**
   * 채널 INSERT 이벤트 핸들러
   *
   * @param payload
   */
  const handleInserts = (payload: any) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      `${payload.new.username}: ${payload.new.content}`,
    ]);
  };

  /**
   * 메세지 전체 삭제
   *
   * @returns {Promise<void>}
   */
  const deleteMessage = async () => {
    if (supabase === null) {
      return;
    }

    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", roomId);

    if (error) {
      console.error("Delete error:", error.message);
      return;
    }

    setMessages([]);
  };

  /**
   * 기존 메세지 가져오기
   *
   * @returns {Promise<string[] | undefined>}
   */
  const fetchMessages = async () => {
    if (supabase === null) {
      return;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select()
      .eq("room_id", roomId);

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }

    const messages = data.map((post) => `${post.username}: ${post.content}`);

    return messages;
  };

  /**
   *  메시지 전송
   *
   * @returns {Promise<void>}
   */
  const handleSendMessage = async () => {
    const user = await supabase?.auth.getUser();
    console.log(user?.data.user?.id, "aa");
    if (supabase === null) {
      return;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        { user_id: user?.data.user?.id, content: newMessage, room_id: roomId },
      ]);

    if (error) {
      console.error("Insert error:", error.message);
      return;
    }

    setNewMessage("");
  };

  const fetchFriends = async () => {
    const user = await supabase.auth.getUser();
    if (supabase === null) {
      return;
    }
    const { data, error } = await supabase
      .from("friend_requests")
      .select("from_user_id")
      .eq("to_user_id", user.data.user?.id)
      .eq("status", true);

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }
    if (data == null) {
      console.log("error");
      return;
    }
    console.log(data);

    const dataArray = await Promise.all(
      data.map(async (i) => {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", i.from_user_id);
        if (error) {
          console.error("Fetch error:", error.message);
          return null;
        }
        if (!data || data.length === 0) {
          console.log("error");
          return null;
        }
        return data[0].username;
      })
    );

    return dataArray;
  };
  const fetchAllFriend = async () => {
    await fetchFriends().then((friends) => {
      if (friends === undefined) {
        return;
      }
      fetchFriends2().then((friends2) => {
        if (friends === undefined) {
          return;
        }
        setFriends(friends.concat(friends2));
      });
    });
  };
  const fetchFriends2 = async () => {
    const user = await supabase.auth.getUser();
    if (supabase === null) {
      return;
    }
    const { data, error } = await supabase
      .from("friend_requests")
      .select("to_user_id")
      .eq("from_user_id", user.data.user?.id)
      .eq("status", true);

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }
    if (data == null) {
      console.log("error");
      return;
    }

    const dataArray = await Promise.all(
      data.map(async (i) => {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", i.to_user_id);
        if (error) {
          console.error("Fetch error:", error.message);
          return null;
        }
        if (!data || data.length === 0) {
          console.log("error");
          return null;
        }
        return data[0].username;
      })
    );
    return dataArray;
  };

  //사용자 초대
  const inviteFriend = async (username: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username);
    const friend_id = data?.[0].id;

    if (error) {
      console.log(error.message);
    }

    await supabase.from("room_requests").insert([
      {
        from_user_id: user.data.user?.id,
        to_user_id: friend_id,
        room_id: roomId,
        status: "pending",
      },
    ]);
  };

  // 채널 이벤트 listen
  useEffect(() => {
    if (supabase.channel === null) {
      return;
    }
    fetchAllFriend();
    console.log("channel listen");
    // 기존 메시지 가져오기
    fetchMessages().then((messages) => {
      if (messages === undefined) {
        return;
      }

      setMessages(messages);
    });

    fetchFriends();
    console.log(friends);

    supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLE_NAME,
          filter: `room_id=eq.${roomId}`,
        },
        handleInserts
      )
      .subscribe();
  }, [supabase]);

  return (
    <main className={styles.main}>
      <div>
        <h1>{channelName}</h1>
        <br />
        <ul>
          {/*기존 메세지가 존재 할 경우 메세지 표시*/}
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send Message</button>

        <div>
          <button onClick={deleteMessage}>delete Message</button>
        </div>
        <div>
          {friends.map((username, index) => (
            <li key={index}>
              {username}
              <button onClick={() => inviteFriend(username)}>
                채팅방 초대
              </button>
            </li>
          ))}
        </div>
      </div>
    </main>
  );
}
