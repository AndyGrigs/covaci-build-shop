-- REPLICA IDENTITY FULL дозволяє Realtime передавати OLD запис при DELETE.
-- Без цього фільтр user_id=eq.X на DELETE-подіях ігнорується,
-- і всі підключені клієнти отримують кожне видалення з кошика будь-якого користувача.
ALTER TABLE public.cart_items REPLICA IDENTITY FULL;
