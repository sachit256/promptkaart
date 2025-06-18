import { Prompt } from '@/types/prompt';
import { Comment } from '@/types/prompt';

export const mockPrompts: Prompt[] = [
  {
    id: '1',
    prompt: 'Design a breathtaking futuristic city skyline at night, featuring towering skyscrapers with glowing neon signs, holographic advertisements floating in the air, and sleek flying cars navigating between buildings. The scene should have a cyberpunk aesthetic with purple and blue color schemes, reflecting on wet streets below.',
    images: [
      'https://images.pexels.com/photos/2664947/pexels-photo-2664947.jpeg',
      'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg',
      'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg'
    ],
    likes: 324,
    comments: 47,
    shares: 23,
    isLiked: false,
    author: {
      id: 'user1',
      name: 'Alex Chen',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
    },
    category: 'Art & Design',
    tags: ['futuristic', 'cyberpunk', 'cityscape', 'neon'],
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    prompt: 'Describe an enchanted forest where bioluminescent plants create a soft, ethereal glow throughout the woodland. Ancient trees with twisted roots and glowing mushrooms dot the landscape, while magical creatures like fireflies the size of hummingbirds dance through the air, leaving trails of sparkling dust.',
    images: [
      'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg',
      'https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg',
      'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg'
    ],
    likes: 567,
    comments: 89,
    shares: 45,
    isLiked: true,
    author: {
      id: 'user2',
      name: 'Maya Patel',
      avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg'
    },
    category: 'Fantasy',
    tags: ['fantasy', 'magic', 'forest', 'creatures'],
    createdAt: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    prompt: 'Envision a massive space station with rotating habitation rings, solar panel arrays stretching for kilometers, and docking bays filled with various spacecraft. The station orbits a beautiful alien world with swirling clouds and multiple moons, while stars and nebulae create a spectacular backdrop.',
    images: [
      'https://images.pexels.com/photos/23769/pexels-photo.jpg',
      'https://images.pexels.com/photos/73873/star-clusters-rosette-nebula-star-galaxies-73873.jpeg',
      'https://images.pexels.com/photos/355935/pexels-photo-355935.jpeg'
    ],
    likes: 412,
    comments: 63,
    shares: 31,
    isLiked: false,
    author: {
      id: 'user3',
      name: 'David Kim',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg'
    },
    category: 'Sci-Fi',
    tags: ['space', 'station', 'future', 'technology'],
    createdAt: '2024-01-13T09:20:00Z'
  },
  {
    id: '4',
    prompt: 'Dive into a pristine underwater world where colorful coral reefs create an underwater garden. Schools of tropical fish in rainbow hues swim between the corals, while sea turtles glide gracefully overhead. Rays of sunlight pierce through the crystal-clear water, creating dancing patterns on the sandy ocean floor.',
    images: [
      'https://images.pexels.com/photos/1054655/pexels-photo-1054655.jpeg',
      'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg',
      'https://images.pexels.com/photos/64219/dolphin-marine-mammals-water-sea-64219.jpeg'
    ],
    likes: 789,
    comments: 112,
    shares: 67,
    isLiked: true,
    author: {
      id: 'user4',
      name: 'Sofia Rodriguez',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
    },
    category: 'Nature',
    tags: ['ocean', 'coral', 'marine', 'underwater'],
    createdAt: '2024-01-12T14:10:00Z'
  },
  {
    id: '5',
    prompt: 'Picture a tranquil oasis surrounded by golden sand dunes during a breathtaking sunset. Palm trees sway gently around a crystal-clear pool of water, reflecting the warm orange and pink hues of the sky. Camels rest nearby while the last rays of sunlight create long shadows across the pristine sand.',
    images: [
      'https://images.pexels.com/photos/1739732/pexels-photo-1739732.jpeg',
      'https://images.pexels.com/photos/847402/pexels-photo-847402.jpeg',
      'https://images.pexels.com/photos/3889659/pexels-photo-3889659.jpeg'
    ],
    likes: 445,
    comments: 78,
    shares: 34,
    isLiked: false,
    author: {
      id: 'user5',
      name: 'Ahmed Hassan',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg'
    },
    category: 'Landscape',
    tags: ['desert', 'oasis', 'sunset', 'nature'],
    createdAt: '2024-01-11T18:30:00Z'
  }
];

export const mockComments: { [promptId: string]: Comment[] } = {
  '1': [
    {
      id: 'c1',
      content: 'This is absolutely stunning! The cyberpunk aesthetic is perfect. Would love to see more variations with different color schemes.',
      author: {
        id: 'user6',
        name: 'Emma Wilson',
        avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg'
      },
      createdAt: '2024-01-15T11:30:00Z',
      likes: 12,
      isLiked: false
    },
    {
      id: 'c2',
      content: 'Great work! The neon reflections on the wet streets really bring this to life. 🌃',
      author: {
        id: 'user7',
        name: 'Marcus Johnson',
        avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg'
      },
      createdAt: '2024-01-15T12:45:00Z',
      likes: 8,
      isLiked: true
    }
  ],
  '2': [
    {
      id: 'c3',
      content: 'Magical! This reminds me of Studio Ghibli films. The bioluminescent details are incredible.',
      author: {
        id: 'user8',
        name: 'Lily Chen',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
      },
      createdAt: '2024-01-14T16:20:00Z',
      likes: 15,
      isLiked: false
    }
  ],
  '3': [
    {
      id: 'c4',
      content: 'The scale of this space station is mind-blowing! Love the attention to detail in the docking bays.',
      author: {
        id: 'user9',
        name: 'Ryan Park',
        avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg'
      },
      createdAt: '2024-01-13T10:15:00Z',
      likes: 6,
      isLiked: false
    }
  ]
};