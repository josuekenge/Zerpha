import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const STATS = [
    "Honey never spoils; archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old.",
    "Octopuses have three hearts: two pump blood to the gills, and one pumps it to the rest of the body.",
    "Bananas are berries, but strawberries are not.",
    "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
    "A group of flamingos is called a 'flamboyance'.",
    "Wombat poop is cube-shaped.",
    "The shortest war in history lasted 38 minutes between Britain and Zanzibar in 1896.",
    "There are more stars in the universe than grains of sand on all the Earth's beaches.",
    "A cloud can weigh more than a million pounds.",
    "The first computer bug was an actual moth found in a Harvard Mark II computer in 1947.",
    "Cleopatra lived closer in time to the moon landing than to the construction of the Great Pyramid of Giza.",
    "A day on Venus is longer than a year on Venus.",
    "Sharks have been around longer than trees.",
    "The unicorn is the national animal of Scotland.",
    "Humans share 60% of their DNA with bananas.",
    "The total weight of all ants on Earth is roughly equal to the total weight of all humans.",
    "Water can boil and freeze at the same time under the right conditions (triple point).",
    "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
    "The heart of a blue whale is so large that a human could swim through its arteries.",
    "Honeybees can recognize human faces.",
    "The average person walks the equivalent of three times around the world in a lifetime.",
    "There is a species of jellyfish that is biologically immortal.",
    "The Great Wall of China is not visible from space with the naked eye.",
    "A single teaspoon of honey represents the life work of 12 bees.",
    "The moon has moonquakes.",
    "Cows have best friends and get stressed when they are separated.",
    "Sea otters hold hands when they sleep to keep from drifting apart.",
    "The inventor of the Pringles can is buried in one.",
    "A snail can sleep for three years.",
    "Sloths can hold their breath longer than dolphins (up to 40 minutes).",
    "The world's oldest wooden wheel has been around for more than 5,000 years.",
    "Dead skin cells make up a large percentage of household dust.",
    "The tongue is the only muscle in the human body attached at only one end.",
    "A jiffy is an actual unit of time: 1/100th of a second.",
    "Dragonflies have six legs but cannot walk.",
    "The electric chair was invented by a dentist.",
    "A shrimp's heart is in its head.",
    "It is impossible to hum while holding your nose.",
    "The only letter that doesn't appear on the periodic table is J.",
    "A crocodile cannot stick its tongue out.",
    "Pigs cannot look up into the sky.",
    "A blue whale's tongue weighs as much as an elephant.",
    "The fingerprints of a koala are so indistinguishable from humans that they have on occasion been confused at a crime scene.",
    "A single cloud can contain billions of pounds of water.",
    "The hottest chili pepper in the world is the Carolina Reaper.",
    "The longest English word is 189,819 letters long and takes 3.5 hours to pronounce (chemical name of titin).",
    "There are more fake flamingos in the world than real ones.",
    "The average person spends 6 months of their lifetime waiting for red lights to turn green.",
    "A baby octopus is about the size of a flea when it is born.",
    "The Earth is not a perfect sphere; it is an oblate spheroid."
];

export function LoadingStats() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Random start index
        setIndex(Math.floor(Math.random() * STATS.length));

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % STATS.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center h-full">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-2xl shadow-lg border border-indigo-100">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Market Data...</h3>

            <div className="h-32 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg"
                    >
                        "{STATS[index]}"
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
}
