-- Recherche d'un profil par adresse (support, administration).
CREATE INDEX IF NOT EXISTS profiles_email ON profiles(email);
