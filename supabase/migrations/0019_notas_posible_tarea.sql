-- «Maybe task»: una nota marcada como posible task, para verlas juntas y convertirlas cuando toque.
alter table public.notas add column posible_tarea boolean not null default false;
grant update (posible_tarea) on public.notas to authenticated;
create index notas_posible_idx on public.notas (espacio_id) where posible_tarea and borrado_en is null and convertida_en_tarea_id is null;
