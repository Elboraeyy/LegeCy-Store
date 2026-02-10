import React from 'react';
import prisma from '@/lib/prisma';
import MessagesClient from './MessagesClient';

export const metadata = {
  title: 'Messages | Admin Dashboard',
};

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Serialize dates to strings for client component
  const serializedMessages = messages.map(msg => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt?.toISOString() || null,
  }));

  return <MessagesClient initialMessages={serializedMessages} />;
}
