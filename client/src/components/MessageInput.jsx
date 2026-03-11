import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { uploadImage } from '../services/api';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

const MessageInput = ({ convId }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();
  const { emit } = useSocket();

  // auto-expanding textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [message]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      emit('typing', {
        convId,
        userId: user._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emit('stop_typing', {
        convId,
        userId: user._id,
      });
    }, 3000);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !imageFile) || sending) return;

    setSending(true);
    const messageToSend = message.trim();

    // stop typing
    setIsTyping(false);
    emit('stop_typing', {
      convId,
      userId: user._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      let imageUrl = null;

      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadImage(imageFile, user.token);
        imageUrl = uploadResult.url;
        setUploading(false);
      }

      emit('send_message', {
        convId,
        content: messageToSend || '',
        senderId: user._id,
        type: imageUrl ? 'image' : 'text',
        imageUrl: imageUrl || null,
      });

      setMessage('');
      handleRemoveImage();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
      setUploading(false);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        emit('stop_typing', {
          convId,
          userId: user._id,
        });
      }
    };
  }, [convId, user._id, emit, isTyping]);

  return (
    <div className="border-t border-gray-200 p-4">
      {/* image preview */}
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-24 w-24 rounded-lg object-cover"
          />
          {!uploading && (
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-400 text-white hover:bg-red-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          {uploading && (
            <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-lg bg-black">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Upload image"
        >
          <PhotoIcon className="h-6 w-6" />
        </button>

        {/* text input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending || uploading}
          rows={1}
          className="flex-1 resize-none overflow-y-auto rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
        />

        {/* send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !imageFile) || sending || uploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          aria-label="Send message"
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
