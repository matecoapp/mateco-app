-- Jednorazové nastavenie: úložisko na "odfotenia" vyplnených servisných protokolov.
-- Spusti v Supabase → SQL Editor. Netreba nič meniť v existujúcich tabuľkách.

-- 1) Vytvorí bucket "protocols" (verejne čitateľný — obrázky sú interné, ale odkaz
--    na konkrétny protokol vie zobraziť len ten, kto ho má z portálu, takže je to v poriadku).
insert into storage.buckets (id, name, public)
values ('protocols', 'protocols', true)
on conflict (id) do nothing;

-- 2) Prihlásení používatelia (celá appka beží pod prihlásením) smú nahrávať aj mazať.
create policy "protocols_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'protocols');

create policy "protocols_delete_authenticated"
on storage.objects for delete
to authenticated
using (bucket_id = 'protocols');

-- 3) Verejné čítanie (potrebné pre <img src="..."> priamo v portáli).
create policy "protocols_select_public"
on storage.objects for select
to public
using (bucket_id = 'protocols');
