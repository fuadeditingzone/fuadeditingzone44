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

// --- Marketplace Types ---

export interface Post {
  id: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl?: string;
  type: 'image' | 'video';
  mediaUrl: string; // for images, base64 data url. for videos, a direct link.
  thumbnailUrl?: string; // For videos
  title: string;
  description?: string;
  tags: string[];
  views: number;
  createdAt: number; // timestamp
}

export interface Job {
  id: string;
  clientUsername: string;
  clientName: string;
  clientAvatarUrl?: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  deadline: string; // e.g., '1 week', '2 weeks'
  createdAt: number; // timestamp
  status: 'open' | 'in-progress' | 'closed';
  hiredDesignerUsername?: string;
}

export interface Submission {
  id: string;
  jobId: string;
  designerUsername: string;
  designerName:string;
  designerAvatarUrl?: string;
  post: Post; // The full post object is submitted
  submittedAt: number; // timestamp
}