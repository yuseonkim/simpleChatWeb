"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const supabase = createClientComponentClient();
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [isLogined, setIsLogined] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleSignIn = async () => {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (response.error) {
      alert(response.error.message);
      return;
    } else {
      setIsLogined(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLogined(false);
  };

  return (
    <div>
      {isLogined == true ? (
        // user 값이 존재할 때의 렌더링
        <>
          <p>
            Welcome <button onClick={handleSignOut}>Sign out</button>
          </p>
          <div></div>
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
