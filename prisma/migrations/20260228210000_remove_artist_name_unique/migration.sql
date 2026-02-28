-- AlterTable: remove unique constraint from Artist.nameRomanized
-- Múltiplos artistas podem ter o mesmo nome romanizado (ex: "Jimin" do BTS e de outros grupos)
DROP INDEX IF EXISTS "Artist_nameRomanized_key";
