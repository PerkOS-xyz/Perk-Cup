-- Perk Olympics - Credits & Scores Schema Update
-- Drop old tables and recreate with new structure

-- Drop existing tables if they exist
DROP TABLE IF EXISTS player_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS high_scores CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Players table with wallet address as primary identifier
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  credits INTEGER DEFAULT 200 NOT NULL,
  credits_last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games configuration table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credit_cost INTEGER NOT NULL DEFAULT 10,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert game configurations
INSERT INTO games (id, name, description, credit_cost, icon, color) VALUES
  ('perk-racer', 'Perk Racer', 'Endless car racing - dodge obstacles and collect coins!', 15, 'car', '#ef4444'),
  ('perk-jump', 'Perk Jump', 'Mario-style platformer - jump across platforms to reach the goal!', 15, 'arrow-up', '#22c55e'),
  ('perk-stack', 'Perk Stack', 'Tower stacking - time your drops to build the tallest tower!', 10, 'layers', '#f59e0b'),
  ('perk-match', 'Perk Match', 'Memory match - find pairs under time pressure!', 10, 'grid', '#8b5cf6'),
  ('perk-pong', 'Perk Pong', 'Beer pong style - aim and throw to sink the balls!', 12, 'target', '#ec4899'),
  ('perk-snake', 'Perk Snake', 'Classic snake - grow longer without hitting yourself!', 8, 'move', '#06b6d4');

-- High scores table
CREATE TABLE high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, game_id)
);

-- Game sessions table for tracking plays
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  credits_spent INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Leaderboard view for easy querying
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  hs.game_id,
  g.name as game_name,
  p.username,
  p.wallet_address,
  hs.score,
  hs.created_at
FROM high_scores hs
JOIN players p ON hs.player_id = p.id
JOIN games g ON hs.game_id = g.id
ORDER BY hs.game_id, hs.score DESC;

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Games table is public read
CREATE POLICY "Games are viewable by everyone" ON games
  FOR SELECT USING (true);

-- Players policies
CREATE POLICY "Players can view all players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Players can insert their own record" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their own record" ON players
  FOR UPDATE USING (true);

-- High scores policies
CREATE POLICY "High scores are viewable by everyone" ON high_scores
  FOR SELECT USING (true);

CREATE POLICY "Players can insert high scores" ON high_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their high scores" ON high_scores
  FOR UPDATE USING (true);

-- Game sessions policies
CREATE POLICY "Game sessions are viewable by everyone" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Players can insert game sessions" ON game_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update game sessions" ON game_sessions
  FOR UPDATE USING (true);

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

-- Trigger to check credits reset on player access
CREATE OR REPLACE TRIGGER check_credits_reset
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_credits();

-- Index for faster leaderboard queries
CREATE INDEX idx_high_scores_game_score ON high_scores(game_id, score DESC);
CREATE INDEX idx_players_wallet ON players(wallet_address);
