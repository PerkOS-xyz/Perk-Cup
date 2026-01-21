-- Perk Olympics Game Schema

-- Players table to track user progress
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_score INTEGER DEFAULT 0,
  gold_medals INTEGER DEFAULT 0,
  silver_medals INTEGER DEFAULT 0,
  bronze_medals INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Game types enum
CREATE TYPE game_type AS ENUM ('running', 'timing', 'reflex');

-- Game sessions to track individual game plays
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  score INTEGER NOT NULL,
  medal TEXT CHECK (medal IN ('gold', 'silver', 'bronze', NULL)),
  duration_ms INTEGER,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL
);

-- Player achievements (junction table)
CREATE TABLE IF NOT EXISTS player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);

-- High scores per game type
CREATE TABLE IF NOT EXISTS high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  score INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, game_type)
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Steps', 'Play your first game', 'trophy', 'games_played', 1),
  ('Getting Started', 'Play 10 games', 'star', 'games_played', 10),
  ('Dedicated Athlete', 'Play 50 games', 'medal', 'games_played', 50),
  ('Gold Rush', 'Win your first gold medal', 'gold-medal', 'gold_medals', 1),
  ('Champion', 'Win 10 gold medals', 'crown', 'gold_medals', 10),
  ('Speed Demon', 'Score 1000 points in Running', 'zap', 'running_score', 1000),
  ('Perfect Timing', 'Score 1000 points in Timing', 'clock', 'timing_score', 1000),
  ('Lightning Reflexes', 'Score 1000 points in Reflex', 'bolt', 'reflex_score', 1000),
  ('Level 5', 'Reach level 5', 'arrow-up', 'level', 5),
  ('Level 10', 'Reach level 10', 'rocket', 'level', 10)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Users can view their own player data" ON players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own player data" ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player data" ON players
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their own game sessions" ON game_sessions
  FOR SELECT USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- RLS Policies for player_achievements
CREATE POLICY "Users can view their own achievements" ON player_achievements
  FOR SELECT USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own achievements" ON player_achievements
  FOR INSERT WITH CHECK (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- RLS Policies for high_scores
CREATE POLICY "Anyone can view high scores" ON high_scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own high scores" ON high_scores
  FOR INSERT WITH CHECK (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own high scores" ON high_scores
  FOR UPDATE USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Achievements table is public read
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_high_scores_game_type ON high_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
