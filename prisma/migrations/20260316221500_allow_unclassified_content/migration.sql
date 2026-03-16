-- Ativar conteúdo sem classificação (ageRating IS NULL) nas listagens públicas.
-- Produções sem ageRating são K-Dramas/filmes legítimos do TMDB sem rating atribuído.
-- Apenas produções com ageRating='18' ou isAdultContent=true são bloqueadas.
UPDATE "system_settings"
SET "allowUnclassifiedContent" = true
WHERE id = 'singleton';
