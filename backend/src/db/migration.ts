import { MIGRATIONS } from "./generated-migrations";
import { Bindings } from "../models";


const tableExists = async (d1: Bindings["DB"], tableName: string): Promise<boolean | undefined> => {
  const result = await d1.prepare("SELECT * FROM sqlite_master WHERE type='table' AND name=?").bind(tableName).run();
  return result.success && result.results && result.results.length > 0;
}

// 执行所有迁移脚本
export async function runMigrations(d1: Bindings["DB"]): Promise<void> {
  try {
    console.log("开始执行数据库迁移...");
    // 检查迁移记录表是否存在
    const migrationsTableExists = await tableExists(d1, "migrations");
    if (!migrationsTableExists) {
      // 创建迁移记录表
      await d1.prepare("CREATE TABLE migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, timestamp TEXT)").run();
      console.log("迁移记录表创建成功");
    }
    
    // 执行迁移
    for (const migration of MIGRATIONS) {
      // 检查是否已执行过该迁移
      const migrationResult = await d1.prepare("SELECT * FROM migrations WHERE name = ?").bind(migration.name).run();
      if (migrationResult.results && migrationResult.results.length > 0) {
        console.log(`迁移 ${migration.name} 已执行过，跳过`);
        continue;
      }
      
      // 分割多个SQL语句并逐个执行
      const statements = migration.sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let allSuccess = true;
      for (const statement of statements) {
        try {
          const result = await d1.prepare(statement).run();
          if (!result.success) {
            console.error(`迁移 ${migration.name} 中的语句执行失败: ${statement.substring(0, 50)}...`);
            allSuccess = false;
          }
        } catch (error) {
          console.error(`迁移 ${migration.name} 中的语句执行出错: ${statement.substring(0, 50)}...`, error);
          allSuccess = false;
        }
      }
      
      if (allSuccess) {
        console.log(`迁移 ${migration.name} 成功`);
        // 写入迁移记录
        await d1.prepare("INSERT INTO migrations (name, timestamp) VALUES (?, ?)").bind(migration.name, new Date().toISOString()).run();
      } else {
        console.error(`迁移 ${migration.name} 失败`);
      }
    }

    console.log("所有迁移已完成");
  } catch (error) {
    console.error("执行迁移脚本时出错:", error);
    throw error;
  }
}

