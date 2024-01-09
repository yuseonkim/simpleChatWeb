"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Room {
  id: number;
  created_at: string;
  name: string;
}

const supabase = createClientComponentClient();
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRoom, setNewRoom] = useState<string>();
  const [isLogined, setIsLogined] = useState<string | null>();
  const CHANNEL = "temp_channel";
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);

  const getUser = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    console.log(user?.id);
    return user?.id;
  };

  // 메시지 핸들러
  const handleInserts = (payload: any) => {
    console.log("Change received!", payload);
    fetchRooms();
  };

  // 채팅방 생성
  const handleCreateRoom = async () => {
    const user_id = (await supabase.auth.getUser()).data.user?.id;
    if (supabase === null) {
      return;
    }
    console.log(`채팅방생성중 이름은 ${newRoom}`);
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ user_id: user_id, name: newRoom }])
      .select();
    if (error) {
      console.error("Insert error:", error.message);
      return;
    }
    if (data == null) {
      return;
    }
    await supabase
      .from("room_participants")
      .insert([{ room_id: data[0].id, user_id: user_id }]);
  };

  // 디비에 저장된 기존 채팅방 가져오기
  const fetchRooms = async () => {
    if (supabase === null) {
      return;
    }
    const { data, error } = await supabase.from("rooms").select("*");

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }
    const dataArray = data.map((item) => ({ ...item }));
    console.log(dataArray);
    setRooms(dataArray);
    return dataArray;
  };

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  useEffect(() => {
    console.log(localStorage.getItem("isLogined"));
    setIsLogined(localStorage.getItem("isLogined"));

    if (!supabase) {
      return;
    }

    // 채널 연결 및 posts테이블의 INSERT 변경사항 추적
    supabase
      .channel(CHANNEL)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rooms" },
        handleInserts
      )
      .on("presence", { event: "sync" }, () => {
        console.log("presence sync");
      })
      .subscribe();

    // 기존 채팅방 가져오기
    fetchRooms().then((rooms) => {
      if (rooms === undefined) {
        return;
      }
      console.log(rooms);
      setRooms(rooms);
    });
  }, [supabase]);

  const handleSignIn = async () => {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (response.error) {
      alert(response.error.message);
      return;
    } else {
      localStorage.setItem("isLogined", "true");
      router.refresh();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.setItem("isLogined", "false");
    router.refresh();
  };

  return (
    <div>
      {isLogined == "true" ? (
        // user 값이 존재할 때의 렌더링
        <>
          <p>
            Welcome <button onClick={handleSignOut}>Sign out</button>
          </p>
          <div>
            <h1>Chatting Rooms</h1>
            <ul>
              {/*기존 채팅방이 존재할 경우 표시*/}
              {rooms.map((room, index) => (
                <Link
                  href={{
                    pathname: `/chat/chat`,
                    query: { channelName: room.name, roomId: room.id },
                  }}
                  key={index}
                >
                  {room.name}
                  <br />
                </Link>
              ))}
            </ul>
          </div>
          <div>채팅방 초대내역</div>
          <div>
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
            />
          </div>
          <button onClick={handleCreateRoom}>채팅방 생성</button>
          <div>
            <Link href="/user/friend">친구목록</Link>
          </div>
        </>
      ) : (
        // user 값이 null일 때의 렌더링
        <>
          <input
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <input
            type="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <button onClick={handleSignUp}>Sign up</button>
          <button onClick={handleSignIn}>Sign in</button>
        </>
      )}
    </div>
  );
}
