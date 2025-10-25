import React from 'react';

export interface GraphicWork {
  id: number;
  imageUrl: string;
  category: 'Photo Manipulation' | 'YouTube Thumbnails' | 'Banner Designs';
}

export interface VideoWork {
  id: number;
  url: string;
  thumbnailUrl?: string;
  mostViewed?: boolean;
}

export type ModalItem = GraphicWork | VideoWork;

export interface SocialLink {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface Service {
  name: string;
  description: string;
  category: 'Graphic Design' | 'Video Editing';
  isMain?: boolean;
  hasBadge?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export type PortfolioTab = 'graphic' | 'vfx';
export type VfxSubTab = 'anime' | 'vfxEdits';

export type Language = 'en' | 'bn' | 'hi' | 'ur';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isFinal?: boolean;
  component?: React.ReactNode;
}

export interface User {
  username: string;
  name: string;
  email: string;
  profession: string;
  role: 'client' | 'designer';
  bio: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  behanceUrl?: string;
}