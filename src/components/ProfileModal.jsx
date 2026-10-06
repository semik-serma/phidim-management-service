'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCamera, FiCheck, FiMail, FiShield, FiUploadCloud, FiUser, FiX } from 'react-icons/fi';
import UserAvatar from './UserAvatar';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
];

export default function ProfileModal({ isOpen, onClose, user, onUpdatePicture }) {
  const [newPicture, setNewPicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(user?.picture || '');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setPreview(dataUrl);
        setNewPicture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url) => {
    setPreview(url);
    setNewPicture(url);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newPicture && !preview) {
      toast.error('Please provide or select a picture');
      return;
    }

    const pictureToSave = newPicture || preview;
    setLoading(true);
    try {
      await onUpdatePicture(pictureToSave);
      toast.success('Profile picture updated successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to update picture:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const currentPreviewUser = {
    ...user,
    picture: preview || user?.picture || '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <FiX className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <h3 className="text-xl font-extrabold text-[#072A44]">User Profile</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage your profile & picture</p>
        </div>

        {/* User Card */}
        <div className="my-5 flex flex-col items-center">
          <div className="relative group">
            <UserAvatar user={currentPreviewUser} size="xl" className="ring-4 ring-[#FFD600] shadow-md" />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#0B5ED7] text-white shadow-md hover:bg-[#0A4FB3] transition"
              title="Upload new image"
            >
              <FiCamera className="h-3.5 w-3.5" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <h4 className="mt-3 text-lg font-extrabold text-[#072A44]">
            {user?.full_name || user?.name || 'Administrator'}
          </h4>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <FiMail className="h-3.5 w-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </div>

          <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
            user?.role === 'staff'
              ? 'bg-blue-100 text-blue-800'
              : user?.role === 'accountant'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            <FiShield className="h-3 w-3" />
            <span>
              {user?.role === 'staff'
                ? 'Staff Member'
                : user?.role === 'accountant'
                ? 'Accountant'
                : 'Administrator'}
            </span>
          </div>
        </div>

        {/* Photo Options */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Upload from Device or Paste Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newPicture.startsWith('data:') ? '' : newPicture}
                placeholder={newPicture.startsWith('data:') ? 'Image uploaded from device' : 'https://...'}
                onChange={(e) => {
                  setNewPicture(e.target.value);
                  setPreview(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0B5ED7] focus:outline-none focus:ring-1 focus:ring-[#0B5ED7]"
              />
              <label
                htmlFor="avatar-upload-btn"
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <FiUploadCloud className="h-4 w-4 text-[#0B5ED7]" />
                <span>Upload</span>
                <input
                  id="avatar-upload-btn"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Or pick an instant avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(url)}
                  className={`relative overflow-hidden rounded-full aspect-square border-2 transition ${
                    preview === url ? 'border-[#0B5ED7] ring-2 ring-[#0B5ED7]/30 scale-105' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                  {preview === url && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#0B5ED7]/40 text-white">
                      <FiCheck className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!newPicture && preview === user?.picture)}
              className="rounded-xl bg-[#0B5ED7] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#0B5ED7]/30 hover:bg-[#0A4FB3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Profile Picture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
