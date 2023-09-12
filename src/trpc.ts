import { createWSClient, wsLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import type { AppRouter } from '../server';

const wsClient = createWSClient({
  url: `ws://localhost:3000`,
});

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});
