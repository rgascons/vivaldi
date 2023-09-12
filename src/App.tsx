import React, { useEffect, useRef, useState } from 'react'
import { UserNav } from './components/user-nav'
import { DataTable, columns } from './components/playlist'
import { trpc } from './trpc';
import { Buffer } from 'buffer';

function App() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const songList = trpc.songList.useQuery();
  const playSong = trpc.playSong.useMutation();
  const songChunks = useRef<ArrayBuffer[]>([]);
  const bufferRef = useRef<SourceBuffer | null>(null);
  const mediaSourceRef = useRef(new MediaSource());
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    playerRef.current!.src = window.URL.createObjectURL(mediaSourceRef.current);
  }, []);

  mediaSourceRef.current.addEventListener('sourceopen', () => {
    bufferRef.current = mediaSourceRef.current.addSourceBuffer('audio/mpeg');
    const buffer = bufferRef.current;
    buffer.mode = 'sequence';

    const updateBuffer = () => {
      if (songChunks.current.length > 0 && !buffer.updating) {
        buffer.appendBuffer(songChunks.current.shift()!);
      }
    }

    buffer.addEventListener('update', function() {
        updateBuffer();
    });

    buffer.addEventListener('updateend', function() {
        updateBuffer();
    });
  })
  trpc.onPlaySong.useSubscription(undefined, {
    onData(song) {
      if (typeof song !== 'string') {
        const buffer = bufferRef.current!;
        const data = Buffer.from(song.data).buffer;
        if (buffer.updating || songChunks.current.length > 0) {
          songChunks.current.push(data);
        } else {
          buffer.appendBuffer(data);
          playerRef.current!.play();
        }
      }
    },
    onError(err) {
      console.error('Subscription error:', err);
    },
  });

  const onPlaySong = (id: string) => {
    const player = playerRef.current!;
    const isPlaying = !!(player.currentTime > 0 && !player.paused && !player.ended && player.readyState > 2);
    
    if (currentlyPlaying === id) {
      if (isPlaying) player.pause();
      else player.play();
    } else {
      if (currentlyPlaying !== null) bufferRef.current!.remove(bufferRef.current!.buffered.start(0), bufferRef.current!.buffered.end(0));
      setCurrentlyPlaying(id);
      playSong.mutate({ id });
    }
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Play any song!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <UserNav />
          </div>
        </div>
        {songList.isSuccess && (
          <div className="container mx-auto py-10">
            <DataTable columns={columns(onPlaySong)} data={songList.data} />
          </div>
        )}
        <video ref={playerRef} />
      </div>
  )
}

export default App
