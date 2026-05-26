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
    // Sort by points desc, goalsDifference desc, wins desc, then name asc
    const players = await this.playerModel
      .find()
      .sort({ points: -1, goalsDifference: -1, wins: -1, name: 1 })
      .exec();

    // Dynamically assign rankings based on sorted order
    return players.map((player, index) => {
      const playerObj = player.toJSON();
      return {
        ...playerObj,
        rank: index + 1,
      };
    });
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
