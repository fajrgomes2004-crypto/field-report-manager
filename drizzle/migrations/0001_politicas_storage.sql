-- Fotos de manutenção: autenticados podem enviar; leitura para o dono da pasta ou admin
CREATE POLICY "Autenticados enviam fotos manutencao" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'manutencao-fotos' AND owner = auth.uid());

CREATE POLICY "Le fotos manutencao proprias ou admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'manutencao-fotos' AND (owner = auth.uid() OR public.is_admin()));

CREATE POLICY "Remove fotos manutencao proprias ou admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'manutencao-fotos' AND (owner = auth.uid() OR public.is_admin()));

-- Arquivos da empresa (logo): leitura para autenticados, escrita para admin
CREATE POLICY "Autenticados leem arquivos empresa" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'empresa-arquivos');

CREATE POLICY "Admin gerencia arquivos empresa" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'empresa-arquivos' AND public.is_admin());

CREATE POLICY "Admin atualiza arquivos empresa" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'empresa-arquivos' AND public.is_admin());

CREATE POLICY "Admin remove arquivos empresa" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'empresa-arquivos' AND public.is_admin());