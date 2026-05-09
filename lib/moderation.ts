// Cache for banned words and regex patterns
let bannedWords: string[] = [];
let regexPatterns: RegExp[] = [];
let cacheInitialized = false;

// Banned words list - embedded directly to avoid file system access
const BANNED_WORDS_CONTENT = `# BizYip Moderation — Banned Terms
# Format: one base term per line (normalization handles case, leetspeak, spacing, repeated chars)
# Normalizer must: lowercase, strip repeated chars, collapse spaces/dots/dashes, map @→a 3→e 1→i 0→o $→s 5→s 7→t 4→a
# Last updated: 2026-05-06

# ============================================================
# RACIAL / ETHNIC SLURS
# ============================================================
nigger
nigga
chink
gook
spic
spick
kike
wetback
beaner
towelhead
raghead
camel jockey
sandnigger
zipperhead
jungle bunny
coon
porch monkey
jigaboo
tar baby
sambo
pickaninny
cracker
honky
gringo
whitey
redskin
injun
halfbreed
mulatto
gyp
gypsy
curry muncher
paki
negro
colored
jap
nip
cholo
darky
spook

# ============================================================
# HOMOPHOBIC / TRANSPHOBIC SLURS
# ============================================================
faggot
fag
dyke
tranny
shemale
ladyboy
heshe
hesheit
queer
homo
sodomite
sissy
pansy
poofter
poof
batty boy
battyboy
bender
carpet muncher

# ============================================================
# ABLEIST SLURS
# ============================================================
retard
retarded
spastic
spaz
cripple
mongoloid
mong
psycho bitch
schizo

# ============================================================
# RELIGIOUS / CULTURAL HATE
# ============================================================
jihadi
jihadist
infidel
crusader killer
islamofascist
christfag
catholicunt
jewfag
zionazi

# ============================================================
# EXPLICIT SEXUAL TERMS
# ============================================================
fuck
fucker
fucking
motherfucker
motherfucking
cunt
pussy
cock
dick
dickhead
dickface
asshole
arsehole
bastard
bitch
slut
whore
skank
hoe
ho
twat
tit
tits
boob
boobs
nipple
nipples
vagina
penis
balls
ballsack
nutsack
scrotum
anal
anus
rectum
blowjob
handjob
rimjob
cumshot
cum
jizz
spunk
facial (sexual context — flagged in combination)
gangbang
threesome
orgy
masturbate
masturbation
fingering
fisting
dildo
vibrator
buttplug
sex tape
nudes
nude pic
naked pic
send nudes
onlyfans
porn
porno
pornography
hentai
loli
shota
nsfw
xxx
69
rape
rapist
molest
molester
pedophile
pedo
groomer
child porn
cp
kiddie porn

# ============================================================
# SELF-HARM / SUICIDE / VIOLENCE
# ============================================================
kill yourself
kys
go kill yourself
end your life
you should die
i want to die
kill myself
slit my wrist
slit your wrist
cut myself
cutting myself
hang yourself
hang myself
suicide method
how to suicide
overdose
shoot yourself
shoot myself
self harm
i hate myself
no one would miss you
nobody would miss you
drink bleach
eat glass
jump off a bridge
jump off a building
go die
die already
kill all
murder everyone
shoot up
school shooting
mass shooting
bomb threat
i will kill
im going to kill
gonna kill
blow up the school
stab you
i will hurt you

# ============================================================
# DOXXING / PERSONAL INFO PATTERNS
# These are handled as regex patterns by the engineer, not plain words.
# Format: [REGEX] prefix means pass to regex engine
# ============================================================
[REGEX] \\b\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b
[REGEX] \\b\\d{5}(?:[-\\s]\\d{4})?\\b
[REGEX] \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b
[REGEX] \\b\\d{1,5}\\s\\w+\\s(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct)\\b
[REGEX] \\b\\d{3}-\\d{2}-\\d{4}\\b
your address is
i know where you live
i know where you go to school
i know your school
i found your location
your ip is
your ip address

# ============================================================
# DRUG DEALING / HARD DRUGS
# ============================================================
buy weed
sell weed
weed for sale
buying drugs
selling drugs
drug dealer
dm for drugs
dm for weed
hit my line for
plug for
the plug
i got plugs
xanax
xans
percocet
percs
fentanyl
fent
heroin
meth
methamphetamine
crystal meth
crack cocaine
crack rock
coke for sale
cocaine for sale
mdma for sale
molly for sale
ecstasy for sale
adderall for sale
oxy for sale
oxycontin
oxys
lean for sale
syrup for sale
dmt for sale
lsd for sale
acid for sale
shrooms for sale
ketamine for sale
ket for sale

# ============================================================
# HATE / EXTREMISM
# ============================================================
white power
white supremacy
white supremacist
white nationalist
nazis
neo nazi
heil hitler
third reich
kkk
ku klux klan
death to
gas the
ethnic cleansing
genocide
kill all blacks
kill all jews
kill all muslims
kill all whites
race war
great replacement
black lives dont matter
all cops should die
terrorist attack
jihad
allahu akbar (in aggressive/threatening context — flagged, reviewed manually)`;

// Initialize the banned words cache
function initializeCache() {
  if (cacheInitialized) return;
  
  try {
    const lines = BANNED_WORDS_CONTENT.split('\n');
    
    bannedWords = [];
    regexPatterns = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Handle regex patterns
      if (trimmedLine.startsWith('[REGEX]')) {
        const pattern = trimmedLine.substring(7).trim();
        try {
          regexPatterns.push(new RegExp(pattern, 'i'));
        } catch (e) {
          console.warn('Invalid regex pattern:', pattern);
        }
      } else {
        // Regular banned word
        bannedWords.push(trimmedLine.toLowerCase());
      }
    }
    
    cacheInitialized = true;
  } catch (error) {
    console.error('Failed to load banned words:', error);
    bannedWords = [];
    regexPatterns = [];
  }
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // Map leetspeak characters
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/4/g, 'a')
    // Collapse repeated characters (more than 2 in a row)
    .replace(/(.)\1{2,}/g, '$1')
    // Collapse spaces, dots, and dashes
    .replace(/[.\s-]+/g, ' ')
    .trim();
}

// Check if text contains any banned words
export function containsBannedWord(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }
  
  initializeCache();
  
  const normalizedText = normalizeText(text);
  
  // Check regex patterns against original text
  for (const regex of regexPatterns) {
    if (regex.test(text)) {
      return true;
    }
  }
  
  // Check banned words against normalized text
  for (const word of bannedWords) {
    const normalizedWord = normalizeText(word);
    if (normalizedText.includes(normalizedWord)) {
      return true;
    }
  }
  
  return false;
}

// Log moderation attempt to database
export async function logModerationAttempt(
  userId: string,
  content: string,
  inputType: string
): Promise<void> {
  try {
    const { createClient } = await import('../utils/supabase/client');
    const supabase = createClient();
    
    await supabase.from('moderation_logs').insert({
      user_id: userId,
      content: content,
      input_type: inputType,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log moderation attempt:', error);
  }
}

// Combined function to check and log
export async function validateAndLogContent(
  userId: string,
  content: string,
  inputType: string
): Promise<{ isValid: boolean; error?: string }> {
  if (containsBannedWord(content)) {
    await logModerationAttempt(userId, content, inputType);
    return { isValid: false, error: 'Inappropriate content. Please rewrite.' };
  }
  
  return { isValid: true };
}
