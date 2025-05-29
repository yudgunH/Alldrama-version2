import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Movie } from './Movie';
import { UserWatchHistory } from './UserWatchHistory';

@Table({
  tableName: 'episodes',
  timestamps: true
})
export class Episode extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  movieId!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  episodeNumber!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  playlistUrl!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  thumbnailUrl!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  duration!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  isProcessed!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  processingError!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'pending'
  })
  processingStatus!: string; // pending, processing, completed, failed

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  views!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relationships
  @BelongsTo(() => Movie)
  movie!: Movie;

  @HasMany(() => UserWatchHistory)
  watchHistories!: UserWatchHistory[];
} 