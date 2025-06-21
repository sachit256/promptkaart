import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, Sparkles, Brain, Zap, Image as ImageIcon, Tag, Send, Loader, CircleCheck as CheckCircle, X, Upload, Camera, Plus, CircleAlert as AlertCircle, FolderOpen, Palette } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

const AI_SOURCES = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#10A37F', icon: Brain },
  { id: 'gemini', name: 'Gemini', color: '#4285F4', icon: Sparkles },
  { id: 'grok', name: 'Grok', color: '#1DA1F2', icon: Zap },
  { id: 'midjourney', name: 'Midjourney', color: '#7C3AED', icon: Palette },
] as const;

const CATEGORIES = [
  'Art & Design',
  'Fantasy',
  'Sci-Fi',
  'Nature',
  'Landscape',
  'Portrait',
  'Abstract',
  'Technology',
  'Architecture',
  'Photography',
];

interface UploadedImage {
  id: string;
  uri: string;
  originalUri?: string; // Keep original URI for thumbnail display
  uploadedUrl?: string; // Store the uploaded Supabase URL
  name: string;
  type: string;
  size: number;
  uploading?: boolean;
  uploadProgress?: number;
}

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // Web file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [prompt, setPrompt] = useState(params.prefilledPrompt as string || '');
  const [selectedAiSource, setSelectedAiSource] = useState<'chatgpt' | 'gemini' | 'grok' | 'midjourney'>(
    (params.prefilledAiSource as 'chatgpt' | 'gemini' | 'grok' | 'midjourney') || 'chatgpt'
  );
  const [selectedCategory, setSelectedCategory] = useState(params.prefilledCategory as string || 'Art & Design');
  const [tags, setTags] = useState<string[]>(
    params.prefilledTags ? JSON.parse(params.prefilledTags as string) : []
  );
  const [tagInput, setTagInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const blockingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous sparkle animation
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();

    return () => {
      sparkleLoop.stop();
      // Cleanup object URLs on unmount
      if (Platform.OS === 'web') {
        uploadedImages.forEach(image => {
          if (image.uri.startsWith('blob:')) {
            URL.revokeObjectURL(image.uri);
          }
        });
      }
      // Remove file input from DOM
      if (fileInputRef.current && Platform.OS === 'web') {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Pulse animation for submit button when form is valid
    if (isFormValid() && !isSubmitting) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [prompt, uploadedImages, imageUrls, isSubmitting]);

  // Animate blocking overlay when uploading
  useEffect(() => {
    if (isSubmitting) {
      Animated.timing(blockingAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(blockingAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSubmitting]);

  const isFormValid = () => {
    return prompt.trim().length > 0;
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlLower = url.toLowerCase();
    
    return supportedExtensions.some(ext => 
      urlLower.includes(ext) || 
      urlLower.includes(ext.replace('.', '%2E'))
    ) || urlLower.includes('pexels.com') || urlLower.includes('unsplash.com');
  };

  const addImageUrl = () => {
    const trimmedUrl = imageUrlInput.trim();
    
    if (!trimmedUrl) {
      Alert.alert('Invalid URL', 'Please enter a valid image URL.');
      return;
    }
    
    if (!validateImageUrl(trimmedUrl)) {
      Alert.alert(
        'Unsupported Format', 
        'Please use URLs that end with .jpg, .jpeg, .png, .gif, or .webp, or use images from Pexels/Unsplash.'
      );
      return;
    }
    
    if (imageUrls.includes(trimmedUrl)) {
      Alert.alert('Duplicate Image', 'This image URL has already been added.');
      return;
    }
    
    if ((imageUrls.length + uploadedImages.length) >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images.');
      return;
    }
    
    setImageUrls([...imageUrls, trimmedUrl]);
    setImageUrlInput('');
  };

  const removeImageUrl = (imageToRemove: string) => {
    setImageUrls(imageUrls.filter(img => img !== imageToRemove));
  };

  const uploadImageToStorage = async (imageUri: string, fileName: string): Promise<string> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Generate a unique file path
      const fileExt = (fileName.split('.').pop() || 'jpg').toLowerCase();
      const contentType = fileExt === 'jpg' ? 'image/jpeg' : `image/${fileExt}`;
      const uniqueFileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      let fileData: any;
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        fileData = await response.blob();
      } else {
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = decode(base64Data);
      }

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(uniqueFileName, fileData, {
          contentType: contentType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      if (!data?.path) {
        throw new Error('Upload successful but no path returned');
      }

      // For private buckets, create a signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('post-images')
        .createSignedUrl(data.path, 31536000); // 1 year expiry

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
      }
      
      const signedUrl = signedUrlData?.signedUrl;
      if (!signedUrl) {
        throw new Error('Invalid signed URL generated');
      }

      return signedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error instanceof Error ? error : new Error('Unknown upload error');
    }
  };

  // Web file upload function
  const pickImageFromBrowser = () => {
    if (Platform.OS !== 'web') return;
    
    if ((uploadedImages.length + imageUrls.length) >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
      return;
    }

    // Create file input if it doesn't exist
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;
    
    input.onchange = async (event: any) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = 5 - (uploadedImages.length + imageUrls.length);
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      if (filesToProcess.length === 0) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
        return;
      }

      const newImages: UploadedImage[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i] as File;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          Alert.alert('Invalid File', `${file.name} is not a valid image file.`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', `${file.name} is too large. Maximum file size is 10MB.`);
          continue;
        }

        const imageId = (Date.now() + i).toString();
        
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        
        const newImage: UploadedImage = {
          id: imageId,
          uri: objectUrl,
          originalUri: objectUrl, // Keep object URL for thumbnail
          name: file.name,
          type: file.type,
          size: file.size,
          uploading: true,
          uploadProgress: 0,
        };

        newImages.push(newImage);
      }

      // Add images to UI immediately for preview
      setUploadedImages(prev => [...prev, ...newImages]);

      // Upload in background without blocking UI
      newImages.forEach(async (image) => {
        const progressInterval = setInterval(() => {
          setUploadedImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, uploadProgress: Math.min((img.uploadProgress || 0) + 10, 85) }
              : img
          ));
        }, 500);

        try {
          const uploadedUrl = await uploadImageToStorage(image.uri, image.name);
          
          clearInterval(progressInterval);
          
          setUploadedImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, uploading: false, uploadProgress: 100, uploadedUrl }
              : img
          ));
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Error uploading image:', error);
          
          setUploadedImages(prev => prev.filter(img => img.id !== image.id));
          // Clean up object URL
          URL.revokeObjectURL(image.uri);
          
          Alert.alert('Upload Failed', `Failed to upload ${image.name}. Please try again.`);
        }
      });

      // Reset file input
      input.value = '';
    };

    input.click();
  };

  // Drag and drop handlers for web
  const handleDragOver = (e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const imageFiles = files.filter((file: any) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      Alert.alert('Invalid Files', 'Please drop only image files.');
      return;
    }

    if ((uploadedImages.length + imageUrls.length) >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
      return;
    }

    const remainingSlots = 5 - (uploadedImages.length + imageUrls.length);
    const filesToProcess = imageFiles.slice(0, remainingSlots);

    const newImages: UploadedImage[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i] as File;
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', `${file.name} is too large. Maximum file size is 10MB.`);
        continue;
      }

      const imageId = (Date.now() + i).toString();
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      
      const newImage: UploadedImage = {
        id: imageId,
        uri: objectUrl,
        originalUri: objectUrl, // Keep object URL for thumbnail
        name: file.name,
        type: file.type,
        size: file.size,
        uploading: true,
        uploadProgress: 0,
      };

      newImages.push(newImage);
    }

    // Add images to UI immediately for preview
    setUploadedImages(prev => [...prev, ...newImages]);

    // Upload in background without blocking UI
    newImages.forEach(async (image) => {
      const progressInterval = setInterval(() => {
        setUploadedImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, uploadProgress: Math.min((img.uploadProgress || 0) + 10, 85) }
            : img
        ));
      }, 500);

      try {
        const uploadedUrl = await uploadImageToStorage(image.uri, image.name);
        
        clearInterval(progressInterval);
        
        setUploadedImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, uploading: false, uploadProgress: 100, uploadedUrl }
            : img
        ));
      } catch (error) {
        clearInterval(progressInterval);
        console.error('Error uploading image:', error);
        
        setUploadedImages(prev => prev.filter(img => img.id !== image.id));
        // Clean up object URL
        URL.revokeObjectURL(image.uri);
        
        Alert.alert('Upload Failed', `Failed to upload ${image.name}. Please try again.`);
      }
    });
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      if ((uploadedImages.length + imageUrls.length) >= 5) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(5 - (uploadedImages.length + imageUrls.length), 5),
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: UploadedImage[] = result.assets.map((asset, index) => {
          const imageId = (Date.now() + index).toString();
          
          let fileExtension = 'jpg';
          if (asset.fileName) {
            const ext = asset.fileName.split('.').pop()?.toLowerCase();
            if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
              fileExtension = ext;
            }
          } else if (asset.type) {
            const typeMap: { [key: string]: string } = {
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/gif': 'gif',
              'image/webp': 'webp'
            };
            fileExtension = typeMap[asset.type] || 'jpg';
          }
          
          return {
            id: imageId,
            uri: asset.uri,
            originalUri: asset.uri, // Keep original for thumbnail
            name: asset.fileName || `image_${imageId}.${fileExtension}`,
            type: asset.type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
            size: asset.fileSize || 0,
            uploading: true,
            uploadProgress: 0,
          };
        });

        // Add images to UI immediately for preview
        setUploadedImages(prev => [...prev, ...newImages]);

        // Upload in background without blocking UI
        newImages.forEach(async (image) => {
          const progressInterval = setInterval(() => {
            setUploadedImages(prev => prev.map(img => 
              img.id === image.id 
                ? { ...img, uploadProgress: Math.min((img.uploadProgress || 0) + 10, 85) }
                : img
            ));
          }, 500);

          try {
            const uploadedUrl = await uploadImageToStorage(image.uri, image.name);
            
            clearInterval(progressInterval);
            
            setUploadedImages(prev => prev.map(img => 
              img.id === image.id 
                ? { ...img, uploading: false, uploadProgress: 100, uploadedUrl }
                : img
            ));
          } catch (error) {
            clearInterval(progressInterval);
            console.error('Error uploading image:', error);
            
            setUploadedImages(prev => prev.filter(img => img.id !== image.id));
            
            Alert.alert('Upload Failed', `Failed to upload ${image.name}. Please try again.`);
          }
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      if ((uploadedImages.length + imageUrls.length) >= 5) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageId = Date.now().toString();
        
        const newImage: UploadedImage = {
          id: imageId,
          uri: asset.uri,
          originalUri: asset.uri, // Keep original for thumbnail
          name: `photo_${imageId}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
          uploading: true,
          uploadProgress: 0,
        };

        // Add image to UI immediately for preview
        setUploadedImages(prev => [...prev, newImage]);

        // Upload in background without blocking UI
        const progressInterval = setInterval(() => {
          setUploadedImages(prev => prev.map(img => 
            img.id === imageId 
              ? { ...img, uploadProgress: Math.min((img.uploadProgress || 0) + 15, 85) }
              : img
          ));
        }, 400);

        try {
          const uploadedUrl = await uploadImageToStorage(asset.uri, newImage.name);
          
          clearInterval(progressInterval);
          
          setUploadedImages(prev => prev.map(img => 
            img.id === imageId 
              ? { ...img, uploading: false, uploadProgress: 100, uploadedUrl }
              : img
          ));
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Error uploading image:', error);
          
          setUploadedImages(prev => prev.filter(img => img.id !== imageId));
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeUploadedImage = (imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove && Platform.OS === 'web' && imageToRemove.uri.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.uri);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const showSuccessAnimation = () => {
    setShowSuccessModal(true);
    
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 3 seconds
    setTimeout(() => {
      hideSuccessAnimation();
    }, 3000);
  };

  const hideSuccessAnimation = () => {
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      router.back();
    });
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to create a post.');
      router.push('/auth');
      return;
    }

    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please enter your AI prompt.');
      return;
    }

    const stillUploading = uploadedImages.some(img => img.uploading);
    if (stillUploading) {
      Alert.alert('Upload in Progress', 'Please wait for all images to finish uploading.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const allImages = [
        ...uploadedImages.filter(img => !img.uploading && img.uploadedUrl).map(img => img.uploadedUrl!),
        ...imageUrls
      ];

      const finalImages = allImages.length > 0 ? allImages : ['https://images.pexels.com/photos/2664947/pexels-photo-2664947.jpeg'];

      console.log('All uploaded image URLs:', allImages);
      console.log('Final images being saved:', finalImages);

      console.log('Submitting post with data:', {
        user_id: user!.id,
        prompt: prompt.trim(),
        ai_source: selectedAiSource,
        category: selectedCategory,
        tags: tags,
        images: finalImages,
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please check your connection')), 30000);
      });

      const insertPromise = supabase.from('posts').insert({
        user_id: user!.id,
        prompt: prompt.trim(),
        ai_source: selectedAiSource,
        category: selectedCategory,
        tags: tags,
        images: finalImages,
      }).select();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to create post');
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from server');
      }

      console.log('Post created successfully:', data);
      setSubmitSuccess(true);
      setIsSubmitting(false); // Reset loading state before showing success
      showSuccessAnimation();
    } catch (error) {
      console.error('Error creating post:', error);
      let errorMessage = 'Failed to create prompt. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please make sure you are signed in.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSubmitError(errorMessage);
      setSubmitSuccess(false);
      setIsSubmitting(false);
    }
  };

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      paddingTop: Platform.OS === 'android' ? insets.top + 12 : insets.top + 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginLeft: 16,
      flex: 1,
    },
    aiIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    aiText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginLeft: 4,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    required: {
      color: colors.error,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      minHeight: 48,
    },
    promptArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    aiSourceContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    aiSourceButton: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      padding: 12,
      alignItems: 'center',
      minHeight: 80,
      justifyContent: 'center',
    },
    aiSourceButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    aiSourceIcon: {
      marginBottom: 6,
    },
    aiSourceText: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryButton: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryButtonActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    categoryText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    categoryTextActive: {
      color: colors.primary,
    },
    tagInputContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    tagInput: {
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tagText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginRight: 4,
    },
    removeTagButton: {
      padding: 2,
    },
    imageUploadContainer: {
      marginBottom: 16,
    },
    imageUploadButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    imageUploadButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
    },
    imageUploadButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    imageUploadButtonDragOver: {
      borderColor: colors.success,
      backgroundColor: colors.success + '10',
      transform: [{ scale: 1.02 }],
    },
    imageUploadIcon: {
      marginBottom: 8,
    },
    imageUploadText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
    },
    imageUploadSubtext: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    uploadedImagesContainer: {
      marginBottom: 16,
    },
    uploadedImageItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    uploadedImagePreview: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    uploadedImageInfo: {
      flex: 1,
    },
    uploadedImageName: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    uploadedImageSize: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    uploadProgress: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      marginTop: 2,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 2,
      marginTop: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    removeImageButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.error + '20',
    },
    urlImageItem: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    urlImagePreview: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    urlImageInfo: {
      flex: 1,
    },
    imageUrl: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginRight: 8,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    submitButtonDisabled: {
      backgroundColor: colors.surfaceVariant,
      shadowOpacity: 0,
      elevation: 0,
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.white,
      marginLeft: 8,
    },
    submitButtonTextDisabled: {
      color: colors.textSecondary,
    },
    submitButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    feedbackContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorContainer: {
      borderColor: colors.error + '40',
      backgroundColor: colors.error + '10',
    },
    successContainer: {
      borderColor: colors.success + '40',
      backgroundColor: colors.success + '10',
    },
    feedbackIcon: {
      marginRight: 12,
    },
    feedbackText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      flex: 1,
    },
    errorText: {
      color: colors.error,
    },
    successText: {
      color: colors.success,
    },
    successModal: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    successModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      marginHorizontal: 32,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
    },
    successIcon: {
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    sparkleContainer: {
      position: 'absolute',
      top: 20,
      right: 20,
    },
    imageCounter: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    // Enhanced blocking overlay styles
    blockingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    blockingContent: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      marginHorizontal: 32,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      minWidth: 280,
    },
    blockingIcon: {
      marginBottom: 20,
    },
    blockingTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    blockingMessage: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },

    blockingSpinner: {
      marginBottom: 16,
    },
    dragOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    dragOverlayText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginTop: 12,
      textAlign: 'center',
    },
  });

  const totalImages = uploadedImages.length + imageUrls.length;
  const hasUploadingImages = uploadedImages.some(img => img.uploading);
  const isBlocked = isSubmitting; // Only block during submission, not image uploads

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          disabled={isSubmitting}
        >
                      <ArrowLeft size={20} color={isSubmitting ? colors.textSecondary : colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Prompt</Text>
        <View style={styles.aiIndicator}>
          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                transform: [{ rotate: sparkleRotation }],
                opacity: sparkleOpacity,
              },
            ]}
          >
            <Sparkles size={16} color={colors.primary} />
          </Animated.View>
        </View>
      </View>

      {/* Success Modal */}
      {showSuccessModal && (
        <Animated.View
          style={[
            styles.successModal,
            {
              opacity: modalAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.successModalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.successIcon,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <CheckCircle size={64} color={colors.success} />
            </Animated.View>
            <Text style={styles.successTitle}>Prompt Created!</Text>
            <Text style={styles.successMessage}>
              Your AI prompt has been successfully created and shared with the community.
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Enhanced Blocking Overlay */}
      {isBlocked && (
        <Animated.View
          style={[
            styles.blockingOverlay,
            {
              opacity: blockingAnim,
            },
          ]}
          pointerEvents="auto"
        >
          <Animated.View
            style={[
              styles.blockingContent,
              {
                transform: [{ scale: blockingAnim }],
              },
            ]}
          >
            <View style={styles.blockingIcon}>
              <Send size={48} color={colors.primary} />
            </View>
            <Text style={styles.blockingTitle}>Creating Prompt</Text>
            <Text style={styles.blockingMessage}>
              Your prompt is being created and will be shared with the community shortly.
            </Text>
            <ActivityIndicator size="large" color={colors.primary} style={styles.blockingSpinner} />
          </Animated.View>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.scrollView,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isSubmitting}
          >
            {/* AI Prompt Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                AI Prompt <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.promptArea]}
                placeholder="Describe what you want the AI to create..."
                placeholderTextColor={colors.textSecondary}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            {/* AI Source Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Source</Text>
              <View style={styles.aiSourceContainer}>
                {AI_SOURCES.map((source) => {
                  const IconComponent = source.icon;
                  const isSelected = selectedAiSource === source.id;
                  
                  return (
                    <TouchableOpacity
                      key={source.id}
                      style={[
                        styles.aiSourceButton,
                        isSelected && styles.aiSourceButtonActive,
                      ]}
                      onPress={() => setSelectedAiSource(source.id)}
                      disabled={isSubmitting}
                    >
                      <View style={styles.aiSourceIcon}>
                        <IconComponent
                          size={22}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <Text style={styles.aiSourceText}>{source.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category;
                  
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        isSelected && styles.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags (Optional)</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.input, styles.tagInput]}
                  placeholder="Add a tag..."
                  placeholderTextColor={colors.textSecondary}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addTag}
                  disabled={!tagInput.trim() || tags.length >= 5 || isSubmitting}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() => removeTag(tag)}
                        disabled={isSubmitting}
                      >
                        <X size={12} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Images Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Images (Optional)</Text>
              <Text style={styles.imageCounter}>
                {totalImages}/5 images added
              </Text>
              
              {/* Image Upload Options */}
              <View 
                style={styles.imageUploadContainer}
                {...(Platform.OS === 'web' && {
                  onDragOver: handleDragOver,
                  onDragLeave: handleDragLeave,
                  onDrop: handleDrop,
                })}
              >
                {Platform.OS === 'web' && isDragOver && (
                  <View style={[styles.dragOverlay, { backgroundColor: colors.success + '20' }]}>
                    <Upload size={48} color={colors.success} />
                    <Text style={[styles.dragOverlayText, { color: colors.success }]}>
                      Drop images here to upload
                    </Text>
                  </View>
                )}
                <View style={styles.imageUploadButtons}>
                  {Platform.OS === 'web' ? (
                    <>
                      <TouchableOpacity
                        style={styles.imageUploadButton}
                        onPress={pickImageFromBrowser}
                        disabled={isSubmitting || totalImages >= 5}
                      >
                        <View style={styles.imageUploadIcon}>
                          <FolderOpen size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.imageUploadText}>Choose from Computer</Text>
                        <Text style={styles.imageUploadSubtext}>
                          JPG, PNG, GIF, WebP
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.imageUploadButton}
                        onPress={pickImage}
                        disabled={isSubmitting || totalImages >= 5}
                      >
                        <View style={styles.imageUploadIcon}>
                          <Upload size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.imageUploadText}>Upload Images</Text>
                        <Text style={styles.imageUploadSubtext}>
                          Alternative method
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.imageUploadButton}
                        onPress={pickImage}
                        disabled={isSubmitting || totalImages >= 5}
                      >
                        <View style={styles.imageUploadIcon}>
                          <Upload size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.imageUploadText}>Upload Images</Text>
                        <Text style={styles.imageUploadSubtext}>
                          JPG, PNG, GIF, WebP
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.imageUploadButton}
                        onPress={takePhoto}
                        disabled={isSubmitting || totalImages >= 5}
                      >
                        <View style={styles.imageUploadIcon}>
                          <Camera size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.imageUploadText}>Take Photo</Text>
                        <Text style={styles.imageUploadSubtext}>
                          Use camera
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Image URL Input */}
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[styles.input, styles.tagInput]}
                    placeholder="Or paste image URL..."
                    placeholderTextColor={colors.textSecondary}
                    value={imageUrlInput}
                    onChangeText={setImageUrlInput}
                    onSubmitEditing={addImageUrl}
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                    contextMenuHidden={false}
                    textContentType="none"
                    keyboardType="default"
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addImageUrl}
                    disabled={!imageUrlInput.trim() || totalImages >= 5 || isSubmitting}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <View style={styles.uploadedImagesContainer}>
                  {uploadedImages.map((image) => (
                    <View key={image.id} style={styles.uploadedImageItem}>
                      <Image
                        source={{ uri: image.uri }}
                        style={styles.uploadedImagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.uploadedImageInfo}>
                        <Text style={styles.uploadedImageName} numberOfLines={1}>
                          {image.name}
                        </Text>
                        <Text style={styles.uploadedImageSize}>
                          {formatFileSize(image.size)}
                        </Text>
                        {image.uploading && (
                          <>
                            <Text style={styles.uploadProgress}>
                              Uploading... {image.uploadProgress || 0}%
                            </Text>
                            <View style={styles.progressBar}>
                              <View
                                style={[
                                  styles.progressFill,
                                  { width: `${image.uploadProgress || 0}%` },
                                ]}
                              />
                            </View>
                          </>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeUploadedImage(image.id)}
                        disabled={image.uploading || isSubmitting}
                      >
                        <X size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Image URLs */}
              {imageUrls.length > 0 && (
                <View style={styles.uploadedImagesContainer}>
                  {imageUrls.map((imageUrl, index) => (
                    <View key={index} style={styles.urlImageItem}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.urlImagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.urlImageInfo}>
                        <Text style={styles.imageUrl} numberOfLines={2}>
                          {imageUrl}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImageUrl(imageUrl)}
                        disabled={isSubmitting}
                      >
                        <X size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isFormValid() || isSubmitting || hasUploadingImages) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid() || isSubmitting || hasUploadingImages}
              >
                <View style={styles.submitButtonContent}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Send size={20} color={isFormValid() && !isSubmitting && !hasUploadingImages ? colors.white : colors.textSecondary} />
                  )}
                  <Text
                    style={[
                      styles.submitButtonText,
                      (!isFormValid() || isSubmitting || hasUploadingImages) && styles.submitButtonTextDisabled,
                    ]}
                  >
                    {hasUploadingImages ? 'Uploading Images...' : (isSubmitting ? 'Creating...' : 'Create Prompt')}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Error Feedback */}
            {submitError && !isSubmitting && (
              <View style={[styles.feedbackContainer, styles.errorContainer]}>
                <View style={styles.feedbackIcon}>
                  <AlertCircle size={20} color={colors.error} />
                </View>
                <Text style={[styles.feedbackText, styles.errorText]}>
                  {submitError}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}