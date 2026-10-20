-- 0012 · Más colores para una task: además de la paleta base (0011), cualquier tono en hex (#rrggbb),
-- para la gama ampliada y el selector libre.
alter table public.tareas drop constraint tareas_color_check;
alter table public.tareas add constraint tareas_color_check check (
  color is null
  or color in ('brasa', 'oro', 'menta', 'cielo', 'azul', 'lavanda', 'rosa', 'rojo', 'grafito')
  or color ~ '^#[0-9a-f]{6}$'
);
