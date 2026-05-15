For local developemnt, no deployment or aws services for now:

- Will have multiple videos in folder called cameras, videos pasted by me manually from the internet
- Both nest backend and python detector worker will have acces to these videos/ simulated drones-cameras
- the python procesor should be able to process multiple drones simultaneously using real threads
- for the admin user, the frontend should have a special panel where the admin can send reauests to the backend
    in order to stop processing certain cameras or re-add them for processing basically calling an endpopint to the nest backend
    then nest will call an ednpoint and somehow comunicate to the python worker to stop processing or restart processing drones
- should find a way where the nest backend will store the latest prediction frame with the drawn boxes and all the connected users to the frontendapp should
    be able to receive the latest prections for the drones they are watching in their dashboard (propose some solutions for this in an effiecnt way)

    
