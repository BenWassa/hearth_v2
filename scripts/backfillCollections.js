require("dotenv").config({ path: ".env.local" });

const { getAdminDb } = require('../server/firebaseAdmin.js');
const { getMediaDetails } = require('../api/_lib/providerClient.js');

async function run() {
  const db = getAdminDb();
  console.log('Fetching media_catalog docs...');
  
  // AppID is hardcoded default. If there are others, they would need iteration, but this covers 99% of Hearth.
  const appIds = ['hearth-default'];
  
  for (const appId of appIds) {
    console.log(`Processing app: ${appId}`);
    const catalogSnapshot = await db.collection('artifacts').doc(appId).collection('media_catalog').get();
    let updatedCount = 0;
    
    console.log(`Found ${catalogSnapshot.docs.length} total catalog items.`);
    
    for (const mediaDoc of catalogSnapshot.docs) {
      const data = mediaDoc.data();
      const type = data.type || data.media?.type;
      const mediaId = mediaDoc.id;
      
      if (type !== 'movie') continue;
      if (data.media && data.media.collection !== undefined) continue;
      
      const provider = data.source?.provider || 'tmdb';
      const providerId = data.source?.providerId || data.providerId;
      if (provider !== 'tmdb' || !providerId) continue;
      
      console.log(`Fetching TMDB for missing collection: ${data.title || mediaId}`);
      const tmdbRes = await getMediaDetails({ id: providerId, type: 'movie' });
      
      if (tmdbRes.ok) {
        const collection = tmdbRes.data.collection || null;
        
        await mediaDoc.ref.set({ media: { collection } }, { merge: true });
        
        const spacesSnapshot = await db.collection('artifacts').doc(appId).collection('spaces').get();
        for (const spaceDoc of spacesSnapshot.docs) {
          const watchDocRef = spaceDoc.ref.collection('watchlist_items').doc(mediaId);
          const watchSnap = await watchDocRef.get();
          if (watchSnap.exists) {
            await watchDocRef.set({ media: { collection } }, { merge: true });
          }
        }
        
        console.log(`   -> Collection updated: ${collection ? collection.name : 'None'}`);
        updatedCount++;
      } else {
        console.log(`   -> Error fetching from TMDB: ${tmdbRes.message}`);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    
    console.log(`Finished app ${appId}. Updated ${updatedCount} movies.`);
  }
}

run().then(() => {
  console.log('Script complete.');
  process.exit(0);
}).catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
