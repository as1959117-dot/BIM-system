QR CODE-ENABLED BIM CONSTRUCTION TRACKING SYSTEM
================================================
Lakeside Arts: Pavilion Expansion — Group 1
BIM and Digital Construction

FILES
-----
index.html   — Element datasheet page (QR code links here)
admin.html   — Admin panel: add, edit, delete elements
styles.css   — All styling (engineering datasheet look)
app.js       — Element page logic + Firebase live listener
admin.js     — Admin panel logic + Firestore read/write

HOW TO CONNECT FIREBASE
-----------------------
1. Go to console.firebase.google.com
2. Create a new project (free Spark plan is fine)
3. Click "Add app" → Web
4. Copy the firebaseConfig object shown
5. Paste it into app.js AND admin.js (both files, same config)
6. In Firebase console → Firestore Database → Create database
7. Set security rules to "test mode" for now (change before going live)

HOW TO USE THE SYSTEM
---------------------
1. Open admin.html in a browser
2. Click "Seed 3 Sample Elements" to populate Beam B145, Column C12, Slab S05
3. Open index.html?id=B145 to see the B145 element datasheet
4. Change any value in admin.html → Save → the element page updates live

QR CODE LINKS
-------------
Each QR code on site should point to:
  index.html?id=B145   (for Beam 145)
  index.html?id=C12    (for Column C12)
  index.html?id=S05    (for Slab S05)

If you host on GitHub Pages, the links would be:
  https://username.github.io/repo/index.html?id=B145

The QR code on the element page is auto-generated from the current URL.

HOW THE LIVE UPDATE WORKS
-------------------------
The element page uses Firebase onSnapshot() — this is a real-time listener.
When you save a change in admin.html, Firestore notifies all open element pages
and they re-render the changed data within 1-2 seconds.
No page refresh needed.

CONNECTING REVIT / ROBOT DATA IN FUTURE
----------------------------------------
The data structure in Firestore matches common Revit schedule export fields.
To connect Revit data later:
  1. Export a Revit schedule as CSV or JSON
  2. Write a small script (Python or Node.js) to parse that file
  3. Push each element's data to Firestore using the element ID as the document ID
  4. The element pages will update automatically

The admin.js seedSampleData() function shows the exact data structure
each element document should follow.

HOSTING
-------
Upload all 5 files to GitHub Pages or any static hosting.
Firebase handles all the data — no server needed.
