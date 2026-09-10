-- ENUMS
CREATE TYPE public.app_role AS ENUM ('administrador', 'tecnico');
CREATE TYPE public.contrato_status AS ENUM ('ativo', 'inativo', 'encerrado');
CREATE TYPE public.manutencao_status AS ENUM ('rascunho', 'concluida', 'cancelada');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'administrador'::public.app_role)
$$;

-- Profiles policies
CREATE POLICY "Usuario le proprio perfil" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Usuario atualiza proprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin insere perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "Usuario le proprios papeis" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Auto-create profile + role on signup (first user becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INT;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO total FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN total = 0 THEN 'administrador'::public.app_role ELSE 'tecnico'::public.app_role END)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- EMPRESA
CREATE TABLE public.empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL DEFAULT '',
  nome_fantasia TEXT,
  cnpj TEXT,
  logo_path TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  site TEXT,
  responsavel_tecnico TEXT,
  conselho TEXT DEFAULT 'CREA',
  registro_conselho TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa TO authenticated;
GRANT ALL ON public.empresa TO service_role;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem empresa" ON public.empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia empresa" ON public.empresa FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER empresa_updated BEFORE UPDATE ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.empresa (razao_social) VALUES ('Minha Empresa de Manutenção Ltda');

-- CONTRATOS
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL,
  cnpj TEXT,
  data_inicio DATE,
  data_fim DATE,
  status public.contrato_status NOT NULL DEFAULT 'ativo',
  responsavel TEXT,
  contato TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia contratos" ON public.contratos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER contratos_updated BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LOCAIS
CREATE TABLE public.locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  responsavel TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX locais_contrato_idx ON public.locais(contrato_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locais TO authenticated;
GRANT ALL ON public.locais TO service_role;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem locais" ON public.locais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia locais" ON public.locais FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER locais_updated BEFORE UPDATE ON public.locais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ITENS DE SERVICO
CREATE TABLE public.itens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_servico TO authenticated;
GRANT ALL ON public.itens_servico TO service_role;
ALTER TABLE public.itens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem itens" ON public.itens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia itens" ON public.itens_servico FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER itens_updated BEFORE UPDATE ON public.itens_servico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MANUTENCOES
CREATE TABLE public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE RESTRICT,
  local_id UUID NOT NULL REFERENCES public.locais(id) ON DELETE RESTRICT,
  tecnico_id UUID NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  descricao TEXT,
  observacoes TEXT,
  status public.manutencao_status NOT NULL DEFAULT 'rascunho',
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manutencoes_contrato_idx ON public.manutencoes(contrato_id);
CREATE INDEX manutencoes_local_idx ON public.manutencoes(local_id);
CREATE INDEX manutencoes_data_idx ON public.manutencoes(data_hora);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencoes TO authenticated;
GRANT ALL ON public.manutencoes TO service_role;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Le manutencoes proprias ou admin" ON public.manutencoes
  FOR SELECT TO authenticated USING (tecnico_id = auth.uid() OR public.is_admin());
CREATE POLICY "Cria manutencao propria" ON public.manutencoes
  FOR INSERT TO authenticated WITH CHECK (tecnico_id = auth.uid() OR public.is_admin());
CREATE POLICY "Atualiza manutencao propria" ON public.manutencoes
  FOR UPDATE TO authenticated USING (tecnico_id = auth.uid() OR public.is_admin()) WITH CHECK (tecnico_id = auth.uid() OR public.is_admin());
CREATE POLICY "Remove manutencao propria" ON public.manutencoes
  FOR DELETE TO authenticated USING (tecnico_id = auth.uid() OR public.is_admin());
CREATE TRIGGER manutencoes_updated BEFORE UPDATE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ITENS DA MANUTENCAO (snapshot de preco)
CREATE TABLE public.manutencao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_id UUID NOT NULL REFERENCES public.manutencoes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens_servico(id) ON DELETE SET NULL,
  codigo_snapshot TEXT NOT NULL DEFAULT '',
  nome_snapshot TEXT NOT NULL,
  unidade_snapshot TEXT NOT NULL DEFAULT 'un',
  categoria_snapshot TEXT,
  valor_unitario_snapshot NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantidade NUMERIC(12,3) NOT NULL DEFAULT 1,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manutencao_itens_manut_idx ON public.manutencao_itens(manutencao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencao_itens TO authenticated;
GRANT ALL ON public.manutencao_itens TO service_role;
ALTER TABLE public.manutencao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Itens seguem manutencao" ON public.manutencao_itens
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.manutencoes m WHERE m.id = manutencao_id AND (m.tecnico_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.manutencoes m WHERE m.id = manutencao_id AND (m.tecnico_id = auth.uid() OR public.is_admin())));

-- FOTOS
CREATE TABLE public.manutencao_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_id UUID NOT NULL REFERENCES public.manutencoes(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  legenda TEXT,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manutencao_fotos_manut_idx ON public.manutencao_fotos(manutencao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencao_fotos TO authenticated;
GRANT ALL ON public.manutencao_fotos TO service_role;
ALTER TABLE public.manutencao_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fotos seguem manutencao" ON public.manutencao_fotos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.manutencoes m WHERE m.id = manutencao_id AND (m.tecnico_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.manutencoes m WHERE m.id = manutencao_id AND (m.tecnico_id = auth.uid() OR public.is_admin())));