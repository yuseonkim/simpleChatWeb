"use client";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import {
  RealtimeChannel,
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";
import { useRouter } from "next/router";

const DATABASE_URL = "https://jhndwoykhhfjycwvxjaz.supabase.co";
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmR3b3lraGhmanljd3Z4amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQyNzQ4MTksImV4cCI6MjAxOTg1MDgxOX0.C622JEBRLj8mMRV0QBuqwwbNf26yEXvd6AsGbn_3pms";
const TABLE_NAME = "messages";

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [nickname, setNickname] = useState<string>("anon");

  const router = useRouter();

  // 현재 페이지의 쿼리 파라미터를 가져오기
  const query = router.query;
  const channelName = query.channelName as string;
  const roomId = Number(query.roomId);

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

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("room_id", roomId);

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
    if (supabase === null) {
      return;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ username: nickname, content: newMessage, room_id: roomId }]);

    if (error) {
      console.error("Insert error:", error.message);
      return;
    }

    setNewMessage("");
  };

  // supabase 연결
  useEffect(() => {
    const supabaseClient = createClient(DATABASE_URL, API_KEY);
    console.log("connect supabase");

    setSupabase(supabaseClient);

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  // 채널 연결 및 기존 메세지 가져오기
  useEffect(() => {
    if (!supabase) {
      return;
    }

    setChannel(supabase.channel(channelName));

    // 기존 메시지 가져오기
    fetchMessages().then((messages) => {
      if (messages === undefined) {
        return;
      }

      setMessages(messages);
    });
  }, [supabase, channelName]);

  // 채널 이벤트 listen
  useEffect(() => {
    if (channel === null) {
      return;
    }
    console.log("channel listen");

    channel
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
  }, [channel]);

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
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div>
          <button onClick={deleteMessage}>delete Message</button>
        </div>
      </div>
    </main>
  );
}
