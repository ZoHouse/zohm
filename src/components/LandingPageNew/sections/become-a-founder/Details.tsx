import React from "react";
import { CheckCircle } from "../../assets/icons";
import { Flex } from "../../structure";
import { Container } from "../../ui";

interface StoryProps {}

interface ListItemProps {
  children?: React.ReactNode;
}

const ListItem: React.FC<ListItemProps> = ({ children }) => {
  return (
    <Flex items="start" className="mb-6">
      <CheckCircle className="text-green-500 flex-shrink-0 mr-2" />
      <span>{children}</span>
    </Flex>
  );
};

const Story: React.FC<StoryProps> = () => {
  return (
    <section>
      <Container
        id="founder-benefits"
        className="md:pt-24 pt-10 md:pb-24 px-4 pb-0 text-left relative"
      >
        <Flex className="md:mx-0 px-8 flex-col md:items-start items-center flex-shrink mx-auto">
          <h2 className="md:text-3xl mb-4 w-full text-left md:leading-10 leading-7 text-xl font-bold">
            Global Founder Member Privileges
          </h2>
          <p className="md:text-xl text-lg mb-8 text-gray-700">
            Welcome to the Zo Network State
          </p>
          <p className="w-full mb-8">
            As a Zo House Founder Member, you're not just joining one property—you're plugging into a global, decentralised network of tech-enabled clubhouses that span continents and cultures. Your membership unlocks an evolving toolkit of privileges, both locally and across every Zo node worldwide.
          </p>

          <h3 className="md:text-2xl text-xl font-bold mb-6 w-full">
            Universal Perks for Every Founder Member
          </h3>

          <div className="w-full space-y-6 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-2">Multi-City Access</h4>
              <ListItem>
                <strong>Drop In, Build Anywhere:</strong> Work, live, or create from any Zo House—San Francisco, Bangalore and every new city node that launches.
              </ListItem>
              <ListItem>
                <strong>Seamless Onboarding:</strong> Founder status recognised instantly at every location.
              </ListItem>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">24/7 Unlocked Entry</h4>
              <ListItem>
                <strong>Always-On Access:</strong> Enter any Zo House, any time.
              </ListItem>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Prime Workspaces</h4>
              <ListItem>
                <strong>Claim Your Spot:</strong> Free first-come, first-served access to desks, studios, co-working zones, and private workspaces at every Zo House.
              </ListItem>
              <ListItem>
                <strong>Amenities Stack:</strong> From gaming lounges to projectors, creative studios to podcast rooms—use the full arsenal, useable as per availability.
              </ListItem>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Events: All-Access Pass</h4>
              <ListItem>
                <strong>Zero Gatekeeping:</strong> Free or priority entry to hackathons, workshops, parties, and networking events at every Zo House.
              </ListItem>
              <ListItem>
                <strong>Global Community:</strong> Meet top founders, builders, and creators from every city in the Zo network.
              </ListItem>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">World-Connected Vibe</h4>
              <ListItem>
                <strong>Instant Collab:</strong> Join city-specific chats, and founders chat—sync with the network from SF to BLR to DXB to wherever we drop next.
              </ListItem>
              <ListItem>
                <strong>Cross-City Rituals:</strong> Take part in global quests, IRL challenges, and virtual community calls.
              </ListItem>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">10% Discount, Everywhere</h4>
              <ListItem>
                <strong>Save On Everything:</strong> Automatic 10% off Zo World stays, events, merch, and all Zo Network services—across every city and node. (*Zo Trips - 5%)
              </ListItem>
            </div>
          </div>

          <h3 className="md:text-2xl text-xl font-bold mb-6 w-full">
            Global Member Protocols
          </h3>
          
          <div className="w-full mb-8">
            <ListItem>
              <strong>Visitor Policy:</strong> Bring up to three guests to any Zo House—member must stay with them inside the property.
            </ListItem>
            <ListItem>
              <strong>Visitor Registration:</strong> All visitors must be registered in advance using the Visitor Form.
            </ListItem>
            <ListItem>
              <strong>Restricted Access:</strong> Visitors only get access to Common spaces (Schelling point, multiverse). If a work desk is needed prior booking is mandatory.
            </ListItem>
            <ListItem>
              <strong>Event Hosting:</strong> To organise your own event, book the space ahead of time via the Zo team, or founders telegram chat.
            </ListItem>
          </div>

          <div className="w-full bg-gray-100 p-6 rounded-lg mb-8">
            <p className="text-sm">
              <strong>Note:</strong> If any member is found disturbing peace within the house OR 7+ members raise concerns about them - they will be put on temporary bans under the purview of Zo team.
            </p>
          </div>

          <div className="w-full text-center md:text-left space-y-2 mb-8">
            <p className="font-bold text-lg">Shape the Network, Not Just the House</p>
            <p>Being a Founder Member means you're an architect of the Zo ecosystem—shaping culture, rituals, and the vibe everywhere Zo lands.</p>
            <p className="font-semibold">Decentralise your lifestyle.<br/>Every Zo House is your house.<br/>The network is your playground.</p>
            <p className="text-lg font-bold mt-4">Join the culture you want to accelerate and own it.</p>
          </div>
        </Flex>
      </Container>
      {/* <Container
        className="md:pt-24 pt-10 md:pb-24 pb-40 text-left text-white"
        style={{ background: "#A3C550" }}
      >
        <Flex className="md:flex-row flex-col md:mx-0 mx-3">
          <p className="md:w-2/3 px-12">
            We will begin minting 48 hours after we have reached 5,555 Discord
            members.
            <br />
            <br />
            And, the first five people to invite 100 members to our Discord
            community will be among the first few ones to earn country NFTs.
            <br />
            <br />
            So, hurry up!
          </p>
          <SocialMediaAnnouncement className="absolute md:-right-108 -right-10 -bottom-40 md:ml-0 md:mt-0 ml-2 md:-bottom-24 md:w-3/5 w-2/3" />
        </Flex>
      </Container> */}
    </section>
  );
};

export default Story;
