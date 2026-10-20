-- Cada minuto, Supabase llama al endpoint de avisos de la app (el cron de Vercel Hobby es diario).
-- La URL y el secreto viven en Vault (avisos_url, cron_secret), no en el repo.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('enviar-avisos', '* * * * *', $cron$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_url'),
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    timeout_milliseconds := 30000
  );
$cron$);
