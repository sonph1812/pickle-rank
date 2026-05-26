import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
  ) {}

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    const wins = createTeamDto.wins ?? 0;
    const losses = createTeamDto.losses ?? 0;
    const goalsDifference = createTeamDto.goalsDifference ?? 0;

    const points = wins * 3;
    const played = wins + losses;

    const newTeam = new this.teamModel({
      name: createTeamDto.name,
      logo: createTeamDto.logo,
      wins,
      losses,
      goalsDifference,
      points,
      played,
    });

    return newTeam.save();
  }

  async findAll(): Promise<any[]> {
    // Sort by points desc, goalsDifference desc, wins desc, then alphabetical name
    const teams = await this.teamModel
      .find()
      .sort({ points: -1, goalsDifference: -1, wins: -1, name: 1 })
      .exec();

    // Dynamically assign rankings based on sorted order
    return teams.map((team, index) => {
      const teamObj = team.toJSON();
      return {
        ...teamObj,
        rank: index + 1,
      };
    });
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamModel.findById(id).exec();
    if (!team) {
      throw new NotFoundException(`Không tìm thấy đội với ID ${id}`);
    }
    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamModel.findById(id).exec();
    if (!team) {
      throw new NotFoundException(`Không tìm thấy đội với ID ${id}`);
    }

    if (updateTeamDto.name !== undefined) {
      team.name = updateTeamDto.name;
    }
    if (updateTeamDto.logo !== undefined) {
      team.logo = updateTeamDto.logo;
    }
    if (updateTeamDto.wins !== undefined) {
      team.wins = updateTeamDto.wins;
    }
    if (updateTeamDto.losses !== undefined) {
      team.losses = updateTeamDto.losses;
    }
    if (updateTeamDto.goalsDifference !== undefined) {
      team.goalsDifference = updateTeamDto.goalsDifference;
    }

    // Recalculate points and played matches
    team.played = team.wins + team.losses;
    team.points = team.wins * 3;

    return team.save();
  }

  async remove(id: string): Promise<Team> {
    const team = await this.teamModel.findByIdAndDelete(id).exec();
    if (!team) {
      throw new NotFoundException(`Không tìm thấy đội với ID ${id}`);
    }
    return team;
  }
}
