import { router } from './trpc';
import { interactions } from './AppRouter.interactions';
import { guestBook } from './AppRouter.guestBook';

export const appRouter = router({
  interactions,
  guestBook,
});

export type AppRouter = typeof appRouter;