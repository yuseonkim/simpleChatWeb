"use client";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { channel } from "diagnostics_channel";
import { SourceTextModule } from "vm";

const DATABASE_URL = "https://jhndwoykhhfjycwvxjaz.supabase.co";
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmR3b3lraGhmanljd3Z4amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQyNzQ4MTksImV4cCI6MjAxOTg1MDgxOX0.C622JEBRLj8mMRV0QBuqwwbNf26yEXvd6AsGbn_3pms";
const CHANNEL = "temp_channel";

interface Room {
  id: number;
  created_at: string;
  channel_name: string;
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState<string>();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // 메시지 핸들러
  const handleInserts = (payload: any) => {
    console.log("Change received!", payload);
  };

  /*
  // 채팅방 삭제
  const deleteRoom = async () => {
    if (supabase === null) {
      return;
    }

    const { error } = await supabase.from("rooms").delete().eq(newRoom, "test");

    if (error) {
      console.error("Delete error:", error.message);
      return;
    }

    setRooms([]);
  };
  */

  // 디비에 저장된 기존 채팅방 가져오기
  const fetchRooms = async () => {
    console.log("패치중");
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
    return dataArray;
  };

  // 채팅방 생성
  const handleCreateRoom = async () => {
    if (supabase === null) {
      return;
    }
    console.log(`채팅방생성중 이름은 ${newRoom}`);
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ channel_name: newRoom }]);
    fetchRooms().then((rooms) => {
      if (rooms === undefined) {
        return;
      }
      console.log(rooms);
      setRooms(rooms);
    });

    if (error) {
      console.error("Insert error:", error.message);
      return;
    }
  };

  // supabase 연결
  useEffect(() => {
    const supabaseClient = createClient(DATABASE_URL, API_KEY);
    console.log("connect supabase");

    setSupabase(supabaseClient);
  }, []);

  useEffect(() => {
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

  return (
    <main className={styles.main}>
      <div>
        <h1>Chatting Rooms</h1>
        <ul>
          {/*기존 채팅방이 존재할 경우 표시*/}
          {rooms.map((room, index) => (
            <Link
              href={{
                pathname: `/chat`,
              }}
              as={`/chat?channelName=${room.channel_name}&roomId=${room.id}`}
              key={index}
            >
              {room.channel_name}
              <br />
            </Link>
          ))}
        </ul>
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
        />
        <button onClick={handleCreateRoom}>Create new Room</button>
      </div>
    </main>
  );
}
