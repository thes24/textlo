import { useRef, useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/authContext';
import { uploadImage, updateUserProfile } from '../services/api';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser} = useAuth();
  const [username, setUsername] = useState(user.username);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarSelect = (e) => {
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

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      alert('Username cannot be empty');
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = user.avatar;

      if (avatarFile) {
        setUploading(true);
        const uploadResult = await uploadImage(avatarFile, user.token);
        avatarUrl = uploadResult.url;
        setUploading(false);
      }

      const updatedUser = await updateUserProfile(
        {
          username: username.trim(),
          avatar: avatarUrl,
        },
        user.token
      );

      updateUser({
        ...user,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUsername(user.username);
    setAvatarPreview(user.avatar);
    setAvatarFile(null);
    onClose();
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <img
              src={avatarPreview || '/avatar-default.png'}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover"
              onError={(e) => {
                e.target.src = '/avatar-default.png';
              }}
            />
            {uploading && (
              <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-full bg-black">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || saving}
            className="mt-3 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PhotoIcon className="h-5 w-5" />
            Change Avatar
          </button>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            placeholder="Enter your username"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
