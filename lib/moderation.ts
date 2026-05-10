// Cache for banned words
let bannedWords: string[] = [];
let cacheInitialized = false;

// Banned words list - embedded directly to avoid file system access
const BANNED_WORDS_CONTENT = `# BizYip Moderation — Banned Terms
# Format: one word per line
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
cameljockey
sandnigger
zipperhead
junglebunny
coon
porchmonkey
jigaboo
tarbaby
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
currymuncher
pakiboy
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
battyboy
battyboy
bender
carpetmuncher

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
psychobitch
schizo

# ============================================================
# RELIGIOUS / CULTURAL HATE
# ============================================================
jihadi
jihadist
infidel
crusaderkiller
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
sextape
nudes
nudepic
nakedpic
sendnudes
onlyfans
porn
porno
pornography
hentai
loli
shota
nsfw
xxx
rape
rapist
molest
molester
pedophile
pedo
groomer
childporn
cp
kiddieporn

# ============================================================
# SELF-HARM / SUICIDE / VIOLENCE
# ============================================================
killyourself
kys
gokillyourself
endyourlife
youshoulddie
iwanttodie
killmyself
slitmywrist
slityourwrist
cutmyself
cuttingmyself
hangyourself
hangmyself
suicidemethod
howtosuicide
overdose
shootyourself
shootmyself
selfharm
noonewouldmissyou
nobodywouldmissyou
drinkbleach
eatglass
jumpoffabridge
jumpoffabuilding
godie
diealready
killall
murdereveryone
shootup
schoolshooting
massshooting
bombthreat
iwillkill
imgoingtokill
gonnakill
blowuptheschool
stabyou
iwillhurtyou

# ============================================================
# DOXXING / PERSONAL INFO
# ============================================================
youraddressis
iknowwhereyoulive
iknowwhereyougotoschool
iknowyourschool
ifoundyourlocation
youripis
youripaddress

# ============================================================
# DRUG DEALING / HARD DRUGS
# ============================================================
buyweed
sellweed
weedforsale
buyingdrugs
sellingdrugs
drugdealer
dmfordrugs
dmforweed
hitmylinefor
plugfor
theplug
igotplugs
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
crackcocaine
crackrock
cokeforsale
cocaineforsale
mdmaforsale
mollyforsale
ecstasyforsale
adderallforsale
oxyforsale
oxycontin
oxys
leanforsale
syrupforsale
dmtforsale
lsdforsale
acidforsale
shroomsforsale
ketamineforsale
ketforsale

# ============================================================
# HATE / EXTREMISM
# ============================================================
whitepower
whitesupremacy
whitesupremacist
whitenationalist
nazis
neonazi
heilhitler
thirdreich
kukluxklan
deathto
gasthe
ethniccleansing
genocide
killallblacks
killalljews
killallmuslims
killallwhites
racewar
greatreplacement
blacklivesdontmatter
allcopsshoulddie
terroristattack
jihad
allahuakbar`;

// Initialize the banned words cache
function initializeCache() {
  if (cacheInitialized) return;
  
  try {
    const lines = BANNED_WORDS_CONTENT.split('\n');
    
    bannedWords = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Add banned word (lowercase for case-insensitive matching)
      bannedWords.push(trimmedLine.toLowerCase());
    }
    
    cacheInitialized = true;
  } catch (error) {
    bannedWords = [];
  }
}

// Check if text contains any banned words
export function containsBannedWord(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }
  
  initializeCache();
  
  const lowerText = text.toLowerCase();
  
  // Check banned words against the text for any substring match
  for (const word of bannedWords) {
    // Check if any banned word appears as a substring in the text
    if (lowerText.includes(word)) {
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
