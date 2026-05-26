import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const wins = createPlayerDto.wins ?? 0;
    const losses = createPlayerDto.losses ?? 0;
    const goalsDifference = createPlayerDto.goalsDifference ?? 0;

    const points = wins * 3;
    const played = wins + losses;

    const newPlayer = new this.playerModel({
      name: createPlayerDto.name,
      logo: createPlayerDto.logo,
      wins,
      losses,
      goalsDifference,
      points,
      played,
    });

    return newPlayer.save();
  }

  async findAll(): Promise<any[]> {
    // Fetch all players (no DB-level sort for computed fields)
    const players = await this.playerModel.find().exec();

    // Multi-criteria sort in JS:
    // 1. Points (desc)          — ai thắng nhiều hơn thì đứng trên
    // 2. Win rate (desc)        — cùng điểm thì tỉ lệ thắng cao hơn xếp trên
    // 3. goalsDifference (desc) — vẫn bằng thì nhìn hiệu số
    // 4. wins raw (desc)        — hiệu số bằng thì nhìn số thắng thô
    // 5. name A→Z               — tất cả bằng thì sort theo tên
    const sorted = players.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;

      const rateA = a.played > 0 ? a.wins / a.played : 0;
      const rateB = b.played > 0 ? b.wins / b.played : 0;
      if (rateB !== rateA) return rateB - rateA;

      if (b.goalsDifference !== a.goalsDifference)
        return b.goalsDifference - a.goalsDifference;

      if (b.wins !== a.wins) return b.wins - a.wins;

      return a.name.localeCompare(b.name, 'vi');
    });

    return sorted.map((player, index) => ({
      ...player.toJSON(),
      rank: index + 1,
    }));
  }

  async findOne(id: string): Promise<Player> {
    const player = await this.playerModel.findById(id).exec();
    if (!player) {
      throw new NotFoundException(`Không tìm thấy thành viên với ID ${id}`);
    }
    return player;
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const player = await this.playerModel.findById(id).exec();
    if (!player) {
      throw new NotFoundException(`Không tìm thấy thành viên với ID ${id}`);
    }

    if (updatePlayerDto.name !== undefined) {
      player.name = updatePlayerDto.name;
    }
    if (updatePlayerDto.logo !== undefined) {
      player.logo = updatePlayerDto.logo;
    }
    if (updatePlayerDto.wins !== undefined) {
      player.wins = updatePlayerDto.wins;
    }
    if (updatePlayerDto.losses !== undefined) {
      player.losses = updatePlayerDto.losses;
    }
    if (updatePlayerDto.goalsDifference !== undefined) {
      player.goalsDifference = updatePlayerDto.goalsDifference;
    }

    // Recalculate points and played matches
    player.played = player.wins + player.losses;
    player.points = player.wins * 3;

    return player.save();
  }

  async remove(id: string): Promise<Player> {
    const player = await this.playerModel.findByIdAndDelete(id).exec();
    if (!player) {
      throw new NotFoundException(`Không tìm thấy thành viên với ID ${id}`);
    }
    return player;
  }
}
