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

// FIX: Add missing type definitions
export interface User {
  uid: string;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string;
  profession: string;
  role: 'client' | 'designer';
  bio?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  behanceUrl?: string;
}

export interface Post {
  id: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl?: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  title: string;
  description: string;
  tags: string[];
  views: number;
  createdAt: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  deadline: string;
  createdAt: number;
  status: 'open' | 'in-progress' | 'completed';
  clientUsername: string;
  clientName: string;
  clientAvatarUrl?: string;
  hiredDesignerUsername?: string;
}

export interface Submission {
  id: string;
  jobId: string;
  designerUsername: string;
  designerName: string;
  designerAvatarUrl?: string;
  post: Post;
}
