export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { registerSubscribers } = await import('@/lib/eventSubscribers');
      registerSubscribers();
  }
}
