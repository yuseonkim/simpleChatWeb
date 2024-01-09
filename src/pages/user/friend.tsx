"use client";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
const CHANNEL = "temp_channel";
const supabase = createClientComponentClient();

export default function Home() {
  const [friends, setFriends] = useState<string[]>([]);
  const [newFriend, setNewFriend] = useState<string>("");
  const [sentFriends, setSentFrineds] = useState<string[]>([]);
  const [reqeustedFriends, setRequestedFriends] = useState<string[]>([]);
  // 메시지 핸들러
  const handleInserts = (payload: any) => {
    console.log("Change received!", payload);
  };

  const handleSendFriendRequest = async () => {
    const user = await supabase.auth.getUser();
    if (supabase === null) {
      return;
    }
    const newFriendUser = await supabase // data에서 입력한 username으로 db 조회
      .from("profiles")
      .select("id")
      .eq("username", newFriend);

    if (friends.includes(newFriend)) {
      console.log(`${newFriend}은 이미 친구입니다.`);
    }
    if (newFriendUser == null) {
      console.log(`no user name ${newFriend} is exist`);
      return;
    }

    const newFriendUserId = newFriendUser.data?.[0]?.id;
    const { data, error } = await supabase.from("friend_requests").insert([
      {
        from_user_id: user.data.user?.id,
        to_user_id: newFriendUserId,
      },
    ]);

    if (error) {
      console.log("insert error", error.message);
    }
    setNewFriend("");
  };

  const fetchSentFriend = async () => {
    const user = await supabase.auth.getUser();
    if (supabase === null) {
      return;
    }
    const { data, error } = await supabase
      .from("friend_requests")
      .select("to_user_id")
      .eq("from_user_id", user.data.user?.id)
      .eq("status", false);

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

  const fetchRequestedFriend = async () => {
    const user = await supabase.auth.getUser();
    if (supabase === null) {
      return;
    }
    const { data, error } = await supabase
      .from("friend_requests")
      .select("from_user_id")
      .eq("to_user_id", user.data.user?.id)
      .eq("status", false);

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

  const showCurrentUser = async () => {
    const data = await supabase.auth.getUser();
    console.log(data);
  };

  // 디비에 저장된 친구 가져오기
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

  const acceptRequested = async (username: string) => {
    const user = supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username);

    if (error) {
      console.log(error.message);
    }
  };

  const denyRequested = async (username: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username);

    if (error) {
      console.log(error.message);
    }

    await supabase
      .from("friend_requests")
      .delete()
      .eq("to_user_name", user.data.user?.id)
      .eq("from_user_name", username);
  };

  const deleteSent = async (username: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username);

    if (error) {
      console.log(error.message);
    }
    await supabase
      .from("friend_requests")
      .delete()
      .eq("from_user_name", user.data.user?.id)
      .eq("to_user_name", username)
      .eq("status", false);
  };

  const deleteFriend = async (username: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .eq("status", false);

    if (error) {
      console.log(error.message);
    }
    (await supabase
      .from("friend_requests")
      .delete()
      .eq("to_user_name", user.data.user?.id)
      .eq("from_user_name", username)
      .eq("status", true)) ||
      supabase
        .from("friend_requests")
        .delete()
        .eq("from_user_name", user.data.user?.id)
        .eq("to_user_name", username)
        .eq("status", true);
  };

  const acceptFriend = async (username: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username);

    if (error) {
      console.log(error.message);
    }

    if (data == null) {
      return;
    }

    console.log(user.data.user?.id);
    console.log(data[0].id);
    await supabase
      .from("friend_requests")
      .update({ status: true })
      .eq("to_user_id", user.data.user?.id)
      .eq("from_user_id", data[0].id)
      .select();
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }
    // 채널 연결 및 posts테이블의 INSERT 변경사항 추적
    supabase
      .channel(CHANNEL)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friend_request" },
        handleInserts
      )
      .on("presence", { event: "sync" }, () => {
        console.log("presence sync");
      })
      .subscribe();
    // 기존 채팅방 가져오기

    fetchFriends().then((friends) => {
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

    fetchSentFriend().then((friends) => {
      if (friends === undefined) {
        return;
      }
      setSentFrineds(friends);
    });

    fetchRequestedFriend().then((friends) => {
      if (friends === undefined) {
        return;
      }
      setRequestedFriends(friends);
    });
  }, [supabase]);

  return (
    <main className={styles.main}>
      <div>
        <h1>친구목록</h1>
        <ul>
          {/*기존 채팅방이 존재할 경우 표시*/}
          {friends.map((username, index) => (
            <li key={index}>
              {username}{" "}
              <button onClick={() => deleteFriend(username)}>친구 삭제</button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
        />
        <br />
        <button onClick={handleSendFriendRequest}>친구 추가</button>
        <br />
        <button onClick={showCurrentUser}>유저보기</button>
        <br />
      </div>
      <div>
        <h3>친구요청목록</h3>
        {sentFriends.map((username, index) => (
          <li key={index}>
            {username}
            <button onClick={() => deleteSent(username)}>친구 요청 취소</button>
          </li>
        ))}
      </div>
      <div>
        <h3>받은요청목록</h3>
        {reqeustedFriends.map((username, index) => (
          <li key={index}>
            {username}
            <button onClick={() => denyRequested(username)}>거절</button>
            <button onClick={() => acceptFriend(username)}>수락</button>
          </li>
        ))}
      </div>
    </main>
  );
}
