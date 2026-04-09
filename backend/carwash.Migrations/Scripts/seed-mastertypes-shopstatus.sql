IF NOT EXISTS (SELECT 1 FROM MasterTypes WHERE Name = 'ShopStatus.Open')
BEGIN
    INSERT INTO MasterTypes (ParentId, Name, Value, Description, IsActive, Seq)
    VALUES (NULL, 'ShopStatus.Open', 'กำลังให้บริการ', 'สถานะร้านเปิดและกำลังให้บริการ', 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM MasterTypes WHERE Name = 'ShopStatus.Busy')
BEGIN
    INSERT INTO MasterTypes (ParentId, Name, Value, Description, IsActive, Seq)
    VALUES (NULL, 'ShopStatus.Busy', 'คิวแน่น', 'สถานะร้านเปิดแต่มีคิวจำนวนมาก', 1, 2);
END

IF NOT EXISTS (SELECT 1 FROM MasterTypes WHERE Name = 'ShopStatus.Closed')
BEGIN
    INSERT INTO MasterTypes (ParentId, Name, Value, Description, IsActive, Seq)
    VALUES (NULL, 'ShopStatus.Closed', 'ปิดร้าน', 'สถานะร้านปิดให้บริการ', 1, 3);
END
