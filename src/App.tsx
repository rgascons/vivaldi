import React, { useRef } from 'react'
import { UserNav } from './components/user-nav'
import { DataTable, columns } from './components/playlist'
import { trpc } from './trpc';
import { Buffer } from 'buffer';

function App() {
  const songList = trpc.songList.useQuery();
  const playSong = trpc.playSong.useMutation();
  const songChunks = useRef<ArrayBuffer[]>([]);
  trpc.onPlaySong.useSubscription(undefined, {
    onData(song) {
      if (typeof song === 'string') {
        const context = new AudioContext();
        const soundSource = context.createBufferSource();
        const audioData = songChunks.current;
        console.log(audioData);

        for (let i = 0; i < audioData.length; i++) {
            context.decodeAudioData(audioData[i], function(soundBuffer) {
                soundSource.buffer = soundBuffer;
                soundSource.connect(context.destination);
                soundSource.start(0);
            }, function(error) {
              console.log(error);
            });
        }
      } else {
        const buffer = Buffer.from(song.data).buffer;
        songChunks.current.push(buffer);
      }
    },
    onError(err) {
      console.error('Subscription error:', err);
    },
  });

  const onPlaySong = (id: string) => {
    playSong.mutate({ id });
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
      </div>
  )
}

export default App
