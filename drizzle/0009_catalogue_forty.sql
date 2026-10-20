-- Upgrade the former ten-article limit without changing other account rights.
UPDATE profiles
SET catalog_rights = json_set(catalog_rights, '$.maxProducts', 40)
WHERE CASE
  WHEN json_valid(catalog_rights) THEN json_extract(catalog_rights, '$.maxProducts')
  ELSE NULL
END = 10;
