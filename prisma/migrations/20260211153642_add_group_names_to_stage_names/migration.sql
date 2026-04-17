-- Add group names to stageNames array for K-pop group members
-- This allows news extraction to match both individual names and group names

-- BTS members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'BTS')
WHERE "nameRomanized" IN ('Jungkook', 'Kim Namjoon', 'Kim Seok-jin', 'Jung Ho-seok', 'Park Jimin', 'Kim Taehyung', 'Min Yoongi')
  AND NOT ('BTS' = ANY("stageNames"));

-- BLACKPINK members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'BLACKPINK')
WHERE "nameRomanized" IN ('Lisa', 'Kim Jennie', 'Jisoo Kim', 'Park Chaeyoung', 'Rosé')
  AND NOT ('BLACKPINK' = ANY("stageNames"));

-- Stray Kids members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'Stray Kids')
WHERE "nameRomanized" IN ('Bang Chan', 'Felix', 'Lee Know', 'Hyunjin', 'Han', 'Changbin', 'Seungmin', 'I.N')
  AND NOT ('Stray Kids' = ANY("stageNames"));

-- TXT (Tomorrow X Together) members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'TXT')
WHERE "nameRomanized" IN ('Choi Soobin', 'Choi Yeonjun', 'Choi Beomgyu', 'Kang Taehyun', 'Huening Kai')
  AND NOT ('TXT' = ANY("stageNames"));

UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'Tomorrow X Together')
WHERE "nameRomanized" IN ('Choi Soobin', 'Choi Yeonjun', 'Choi Beomgyu', 'Kang Taehyun', 'Huening Kai')
  AND NOT ('Tomorrow X Together' = ANY("stageNames"));

-- TWICE members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'TWICE')
WHERE "nameRomanized" IN ('Im Nayeon', 'Yoo Jeongyeon', 'Hirai Momo', 'Minatozaki Sana', 'Park Jihyo', 'Myoui Mina', 'Kim Dahyun', 'Son Chaeyoung', 'Chou Tzuyu')
  AND NOT ('TWICE' = ANY("stageNames"));

-- EXO members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'EXO')
WHERE "nameRomanized" IN ('Kim Jun-myeon', 'Byun Baek-hyun', 'Park Chanyeol', 'Do Kyung-soo', 'Kim Jong-dae', 'Oh Se-hun', 'Kai')
  AND NOT ('EXO' = ANY("stageNames"));

-- SEVENTEEN members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'SEVENTEEN')
WHERE "nameRomanized" IN ('Choi Seung-cheol', 'Yoon Jeong-han', 'Hong Ji-soo', 'Wen Junhui', 'Kwon Soon-young', 'Jeon Won-woo', 'Lee Ji-hoon', 'Xu Ming-hao', 'Kim Min-gyu', 'Lee Seok-min', 'Boo Seung-kwan', 'Chwe Han-sol', 'Lee Chan')
  AND NOT ('SEVENTEEN' = ANY("stageNames"));

-- NCT/NCT 127/NCT Dream members (common ones)
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'NCT')
WHERE "nameRomanized" IN ('Lee Taeyong', 'Mark Lee', 'Johnny Suh', 'Nakamoto Yuta', 'Kim Dong-young', 'Jung Yoon-oh', 'Lee Jeno', 'Haechan', 'Na Jaemin', 'Zhong Chen-le', 'Park Jisung')
  AND NOT ('NCT' = ANY("stageNames"));

-- Red Velvet members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'Red Velvet')
WHERE "nameRomanized" IN ('Bae Joo-hyun', 'Kang Seul-gi', 'Son Seung-wan', 'Park Soo-young', 'Kim Ye-rim')
  AND NOT ('Red Velvet' = ANY("stageNames"));

-- ITZY members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'ITZY')
WHERE "nameRomanized" IN ('Hwang Ye-ji', 'Choi Ji-su', 'Shin Ryu-jin', 'Lee Chae-ryeong', 'Shin Yu-na')
  AND NOT ('ITZY' = ANY("stageNames"));

-- NewJeans members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'NewJeans')
WHERE "nameRomanized" IN ('Kim Min-ji', 'Hanni Pham', 'Danielle Marsh', 'Kang Hae-rin', 'Lee Hye-in')
  AND NOT ('NewJeans' = ANY("stageNames"));

-- (G)I-DLE members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", '(G)I-DLE')
WHERE "nameRomanized" IN ('Jeon So-yeon', 'Cho Mi-yeon', 'Minnie', 'Song Yu-qi', 'Yeh Shu-hua')
  AND NOT ('(G)I-DLE' = ANY("stageNames"));

UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'IDLE')
WHERE "nameRomanized" IN ('Jeon So-yeon', 'Cho Mi-yeon', 'Minnie', 'Song Yu-qi', 'Yeh Shu-hua')
  AND NOT ('IDLE' = ANY("stageNames"));

-- aespa members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'aespa')
WHERE "nameRomanized" IN ('Yoo Ji-min', 'Uchinaga Aeri', 'Kim Min-jeong', 'Ning Yi-zhuo')
  AND NOT ('aespa' = ANY("stageNames"));

-- LE SSERAFIM members
UPDATE "Artist"
SET "stageNames" = array_append("stageNames", 'LE SSERAFIM')
WHERE "nameRomanized" IN ('Kim Chae-won', 'Sakura Miyawaki', 'Huh Yun-jin', 'Kazuha Nakamura', 'Hong Eun-chae')
  AND NOT ('LE SSERAFIM' = ANY("stageNames"));
