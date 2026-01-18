'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to /design page
        router.replace('/design');
    }, [router]);

    return (
        <div className="h-full w-full flex items-center justify-center bg-[#1a1a1a]">
            <div className="text-muted-foreground">
                Redirecting to design view...
            </div>
        </div>
    );
}
