-- Drop all existing tables and recreate fresh
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS high_scores CASCADE;
DROP TABLE IF EXISTS player_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS games CASCADE;

-- Create games table with credit costs
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credit_cost INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all 6 games with varied pricing
INSERT INTO games (id, name, description, credit_cost, difficulty, icon) VALUES
  ('perk-racer', 'Perk Racer', 'Dodge obstacles and collect coins in endless racing action!', 15, 'hard', 'car'),
  ('perk-jump', 'Perk Jump', 'Platform your way to victory Mario-style!', 15, 'hard', 'arrow-up'),
  ('perk-stack', 'Perk Stack', 'Stack blocks perfectly to build the tallest tower!', 10, 'medium', 'layers'),
  ('perk-match', 'Perk Match', 'Find matching pairs before time runs out!', 10, 'medium', 'grid'),
  ('perk-pong', 'Perk Pong', 'Aim and throw to land balls in cups!', 12, 'medium', 'target'),
  ('perk-snake', 'Perk Snake', 'Grow your snake without hitting walls or yourself!', 8, 'easy', 'move');

-- Create players table with wallet address and credits
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  credits INTEGER NOT NULL DEFAULT 200,
  total_score BIGINT DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  credits_last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create high_scores table
CREATE TABLE high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, game_id)
);

-- Create game_sessions table for history
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_players_wallet ON players(wallet_address);
CREATE INDEX idx_high_scores_game ON high_scores(game_id);
CREATE INDEX idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX idx_game_sessions_player ON game_sessions(player_id);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Games are public read
CREATE POLICY "Games are viewable by everyone" ON games FOR SELECT USING (true);

-- Players policies
CREATE POLICY "Players can view all players" ON players FOR SELECT USING (true);
CREATE POLICY "Players can insert their own record" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own record" ON players FOR UPDATE USING (true);

-- High scores policies  
CREATE POLICY "High scores are viewable by everyone" ON high_scores FOR SELECT USING (true);
CREATE POLICY "Players can insert their own scores" ON high_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own scores" ON high_scores FOR UPDATE USING (true);

-- Game sessions policies
CREATE POLICY "Sessions are viewable by everyone" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Players can insert their own sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own sessions" ON game_sessions FOR UPDATE USING (true);

-- Function to reset credits monthly
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credits_last_reset < NOW() - INTERVAL '30 days' THEN
    NEW.credits := 200;
    NEW.credits_last_reset := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for monthly credit reset
DROP TRIGGER IF EXISTS check_monthly_credits ON players;
CREATE TRIGGER check_monthly_credits
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_credits();
