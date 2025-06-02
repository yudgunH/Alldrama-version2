import { Episode } from '../models/Episode';
import sequelize from '../config/database';

/**
 * Script để cập nhật processingStatus dựa trên isProcessed hiện có
 * Chạy một lần để migrate data
 */
async function updateProcessingStatus() {
  try {
    console.log('🔄 Bắt đầu cập nhật processing status...');
    
    // Kết nối database
    await sequelize.authenticate();
    console.log('✅ Đã kết nối database');
    
    // Đồng bộ model
    await sequelize.sync();
    
    // Cập nhật trạng thái dựa trên isProcessed hiện có
    const transaction = await sequelize.transaction();
    
    try {
      // Cập nhật những episode đã xử lý xong
      const completedResult = await sequelize.query(
        `UPDATE episodes SET processingStatus = 'completed' 
         WHERE isProcessed = true AND (processingStatus IS NULL OR processingStatus = 'pending')`,
        { transaction }
      );
      
      // Cập nhật những episode chưa xử lý
      const pendingResult = await sequelize.query(
        `UPDATE episodes SET processingStatus = 'pending' 
         WHERE isProcessed = false AND (processingStatus IS NULL OR processingStatus = '')`,
        { transaction }
      );
      
      // Commit transaction
      await transaction.commit();
      
      console.log(`✅ Đã cập nhật ${completedResult[1]} episode thành 'completed'`);
      console.log(`✅ Đã cập nhật ${pendingResult[1]} episode thành 'pending'`);
      
      // Hiển thị thống kê
      const stats = await Episode.findAll({
        attributes: [
          'processingStatus',
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['processingStatus'],
        raw: true
      });
      
      console.log('\n📊 Thống kê sau khi cập nhật:');
      stats.forEach((stat: any) => {
        console.log(`   ${stat.processingStatus || 'null'}: ${stat.count} episode(s)`);
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật processing status:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('✅ Hoàn thành migration');
    process.exit(0);
  }
}

// Chạy script
if (require.main === module) {
  updateProcessingStatus();
}

export { updateProcessingStatus }; 