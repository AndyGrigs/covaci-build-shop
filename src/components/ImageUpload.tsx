import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  compact?: boolean;
  /** false — only clear the slot, do not delete the file from Storage (edit mode) */
  deleteFileOnRemove?: boolean;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  compact = false,
  deleteFileOnRemove = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обробка вибору файлу
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валідація типу файлу
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Валідація розміру (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    // Показати preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Завантажити на Supabase Storage
    await uploadImage(file);
  };

  // Завантаження зображення на Supabase
  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Генеруємо унікальне ім'я файлу
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Завантажуємо файл
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Отримуємо публічний URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Повідомляємо батьківський компонент
      onImageUploaded(publicUrl);

      alert('Изображение успешно загружено!');
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      alert(`Ошибка при загрузке изображения: ${error.message || 'Неизвестная ошибка'}`);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  // Видалення зображення
  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    // Видаляємо з preview
    setPreview(null);
    
    // Повідомляємо батьківський компонент
    if (onImageRemoved) {
      onImageRemoved();
    }

    if (!deleteFileOnRemove) return;

    // Опціонально: видалити файл з Storage
    try {
      const urlParts = currentImageUrl.split('/product-images/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('product-images')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
    }
  };

  const zoneH = compact ? 'h-20' : 'h-48';
  const iconSize = compact ? 'w-8 h-8' : 'w-16 h-16';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {preview ? (
        <div className={`relative w-full ${zoneH} bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300`}>
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
            title="Удалить изображение"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className={`w-full ${zoneH} bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center`}>
          <ImageIcon className={`${iconSize} text-gray-400`} />
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full bg-brand text-gray-900 px-4 py-2 rounded-lg hover:bg-brand-dark transition flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span>Загрузка...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>{preview ? 'Изменить' : 'Загрузить фото'}</span>
            </>
          )}
        </button>
      </div>

      {!compact && (
        <p className="text-xs text-gray-500 text-center">
          Допустимые форматы: JPG, PNG, GIF, WEBP. Максимальный размер: 5MB
        </p>
      )}
    </div>
  );
}