import { publicProcedure, router } from './trpc';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { observable } from '@trpc/server/observable';
import ws from 'ws';
import { EventEmitter } from 'events';
import { z } from 'zod';
import fs from 'fs';

const ee = new EventEmitter();

const appRouter = router({
  songList: publicProcedure
    .query(async () => {
      
      return [
        {
          id: "1",
          title: "Bad Romance",
          album: "Born this way",
          duration: "2:55",
        },
        {
          id: "2",
          title: "Below",
          album: "Pitfalls",
          duration: "5:52",
        }
      ]
    }),
  playSong: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async (opts) => {
      const { id } = opts.input;
      ee.emit('stream:song', id);
    }),
  onPlaySong: publicProcedure.subscription(() => {
    return observable<string | Buffer>((emit) => {
      const onPlaySong = (data: string) => {
        const readStream = fs.createReadStream(`./music/${data}.ogg`,
          {
              flags: 'r',
              highWaterMark: 128 * 1024,
          }
        );

        readStream.on('data', (data) => {
          // emit data to client
          emit.next(data);
        });

        readStream.on('end', function() {
          emit.next('end');
      });
      };
      // trigger `onPlaySong()` when `playSong` is triggered in our event emitter
      ee.on('stream:song', onPlaySong);
      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off('stream:song', onPlaySong);
      };
    });
  })
});

const wss = new ws.Server({
  port: 3000,
});

const handler = applyWSSHandler({ wss, router: appRouter });

wss.on('connection', (ws) => {
  console.log(`++ Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(`-- Connection (${wss.clients.size})`);
  });
});
console.log('✅ WebSocket Server listening on ws://localhost:3000');
process.on('SIGTERM', () => {
  console.log('SIGTERM');
  handler.broadcastReconnectNotification();
  wss.close();
});

export type AppRouter = typeof appRouter;
