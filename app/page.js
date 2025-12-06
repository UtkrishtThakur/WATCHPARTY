'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to room/join if logged in
      router.push('/room/join');
    } else {
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          🎬 WatchParty
        </h1>
        <p className="text-gray-600 mb-8">
          Watch videos together with friends in real-time
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/auth/login"
            className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            🔐 Login
          </Link>
          <Link
            href="/auth/register"
            className="inline-block w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            ✨ Register
          </Link>
        </div>

        <hr className="my-6" />

        <p className="text-sm text-gray-500">
          Create or join rooms and watch together with your friends!
        </p>
      </div>
    </div>
  );
}
