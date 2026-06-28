import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, setDoc, query, orderBy, onSnapshot, increment } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Creates a new incident document in the 'incidents' collection.
 * Structures the document exactly as required by Phase 4.
 */
export const createIncident = async (incidentPayload) => {
  const {
    analysis,
    authority,
    resolution,
    impactPrediction,
    summary,
    location,
    description,
    city,
    state,
    country,
    landmark,
    latitude,
    longitude
  } = incidentPayload;

  const documentData = {
    analysis: analysis || {},
    authority: authority || {},
    resolution: resolution || {},
    impactPrediction: impactPrediction || {},
    summary: summary || '',

    location: location || '',
    description: description || '',
    city: city || 'Unknown',
    state: state || 'Unknown',
    country: country || 'Unknown',
    landmark: landmark || '',
    latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
    longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,

    status: 'Open',
    verificationCount: 0,

    createdAt: serverTimestamp(),

    aiModel: 'gemini-2.5-flash',

    source: 'Citizen',

    priorityScore: typeof analysis?.riskScore === 'number'
      ? analysis.riskScore
      : parseFloat(analysis?.riskScore) || 0,
    severity: analysis?.severity || '',

    isResolved: false
  };

  try {
    const docRef = await addDoc(collection(db, 'incidents'), documentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating Firestore incident document:', error);
    throw new Error('Database insertion failed: ' + (error.message || 'Permissions error or network failure.'));
  }
};

/**
 * Retrieves a single incident by its document ID.
 */
export const getIncidentById = async (id) => {
  try {
    const docRef = doc(db, 'incidents', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Incident not found.');
    }
  } catch (error) {
    console.error('Error fetching incident document:', error);
    throw new Error('Database retrieval failed: ' + (error.message || 'Incident not found.'));
  }
};

/**
 * Retrieves all incidents from the 'incidents' collection.
 */
export const getAllIncidents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'incidents'));
    const incidents = [];
    querySnapshot.forEach((doc) => {
      incidents.push({ id: doc.id, ...doc.data() });
    });
    return incidents;
  } catch (error) {
    console.error('Error fetching all incidents:', error);
    throw new Error('Database query failed: ' + (error.message || 'Network connection failed.'));
  }
};

/**
 * Updates the operational status of an incident.
 * Automatically toggles isResolved if status is set to 'Resolved'.
 */
export const updateIncidentStatus = async (id, status) => {
  try {
    const docRef = doc(db, 'incidents', id);
    const updatePayload = { status };
    if (status === 'Resolved') {
      updatePayload.isResolved = true;
    } else {
      updatePayload.isResolved = false;
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.error('Error updating incident status:', error);
    throw new Error('Database update failed: ' + (error.message || 'Operation not authorized.'));
  }
};



export const getLiveIncidents = (callback, onError) => {
  try {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const incidents = snapshot.docs.map((doc) => {
        const data = doc.data();
        let formattedCreatedAt = data.createdAt;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          formattedCreatedAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt && data.createdAt.seconds) {
          formattedCreatedAt = new Date(data.createdAt.seconds * 1000).toISOString();
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt: formattedCreatedAt
        };
      });
      callback(incidents);
    }, (error) => {
      console.error('Firestore snapshot listener failed:', error);
      if (onError) onError(error);
    });
  } catch (error) {
    console.error('Error establishing live feed query:', error);
    if (onError) onError(error);
  }
};

/**
 * Toggles a citizen verification count up or down inside Firestore.
 */
export const toggleVerification = async (id, shouldIncrement) => {
  try {
    const docRef = doc(db, 'incidents', id);
    await updateDoc(docRef, {
      verificationCount: increment(shouldIncrement ? 1 : -1)
    });
  } catch (error) {
    console.error('Error toggling verification count in Firestore:', error);
    throw new Error('Failed to save verification. Please check network and permissions.');
  }
};

/**
 * Updates arbitrary fields of an incident inside Firestore.
 */
export const updateIncident = async (id, fieldsToUpdate) => {
  try {
    const docRef = doc(db, 'incidents', id);
    await updateDoc(docRef, fieldsToUpdate);
  } catch (error) {
    console.error('Error updating incident in Firestore:', error);
    throw new Error('Failed to update incident details: ' + (error.message || 'Network error'));
  }
};

/**
 * Retrieves cached city intelligence document from 'cityIntelligence' collection.
 */
export const getFirestoreCachedIntelligence = async (cityName) => {
  try {
    const docRef = doc(db, 'cityIntelligence', cityName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error(`Error reading cached city intelligence for ${cityName}:`, error);
    return null;
  }
};

/**
 * Persists city intelligence document in 'cityIntelligence' collection.
 */
export const setFirestoreCachedIntelligence = async (cityName, data, fingerprint) => {
  try {
    const docRef = doc(db, 'cityIntelligence', cityName);
    await setDoc(docRef, {
      data,
      fingerprint,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`Error saving cached city intelligence for ${cityName}:`, error);
  }
};

